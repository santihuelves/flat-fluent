-- ================================================
-- PROFILE INTENTIONS SYSTEM
-- Permite a los usuarios tener múltiples intenciones activas
-- ================================================

-- 1. Crear ENUM para tipos de intención
DO $$ BEGIN
  CREATE TYPE public.convinter_intention_type AS ENUM (
    'seek_room',        -- Busco habitación
    'offer_room',       -- Ofrezco habitación
    'seek_flatmate'     -- Busco compañero(s) para piso completo
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Crear ENUM para nivel de urgencia
DO $$ BEGIN
  CREATE TYPE public.convinter_urgency_level AS ENUM (
    'urgent',    -- Urgente (<1 mes)
    'soon',      -- Pronto (1-3 meses)
    'flexible',  -- Flexible (3+ meses)
    'exploring'  -- Explorando opciones
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Tabla principal de intenciones (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS public.convinter_profile_intentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.convinter_profiles(user_id) ON DELETE CASCADE,
  intention_type public.convinter_intention_type NOT NULL,
  is_primary boolean DEFAULT false,
  priority int DEFAULT 1 CHECK (priority BETWEEN 1 AND 10),
  urgency public.convinter_urgency_level DEFAULT 'flexible',
  active boolean DEFAULT true,
  
  -- Detalles específicos por tipo
  details jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint: un usuario no puede tener dos intenciones del mismo tipo activas
  UNIQUE (profile_id, intention_type, active)
);

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_profile_intentions_profile_id 
ON public.convinter_profile_intentions(profile_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_profile_intentions_type 
ON public.convinter_profile_intentions(intention_type) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_profile_intentions_urgency 
ON public.convinter_profile_intentions(urgency) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_profile_intentions_primary 
ON public.convinter_profile_intentions(profile_id, is_primary) WHERE is_primary = true;

-- 5. Tabla para detalles específicos por tipo de intención
CREATE TABLE IF NOT EXISTS public.convinter_intention_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intention_id uuid NOT NULL REFERENCES public.convinter_profile_intentions(id) ON DELETE CASCADE,
  
  -- Para "offer_room" (Ofrezco habitación)
  num_rooms_available int,
  is_owner boolean,
  current_flatmates int,
  
  -- Para "seek_flatmate" (Busco compañero)
  desired_flat_size int, -- Número total de personas deseado en el piso
  people_committed int DEFAULT 1, -- Cuántas personas ya están comprometidas (incluido el usuario)
  
  -- Comunes (complementan datos del perfil)
  move_in_date_from date,
  move_in_date_to date,
  budget_min_override int, -- Si quiere un presupuesto diferente para esta intención
  budget_max_override int,
  preferred_locations text[], -- Barrios o ciudades específicas
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (intention_id)
);

-- 6. Trigger para timestamps
CREATE OR REPLACE FUNCTION public.update_intention_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_intentions_updated_at
BEFORE UPDATE ON public.convinter_profile_intentions
FOR EACH ROW
EXECUTE FUNCTION public.update_intention_updated_at();

CREATE TRIGGER update_intention_details_updated_at
BEFORE UPDATE ON public.convinter_intention_details
FOR EACH ROW
EXECUTE FUNCTION public.update_intention_updated_at();

-- 7. RLS Policies
ALTER TABLE public.convinter_profile_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convinter_intention_details ENABLE ROW LEVEL SECURITY;

-- Ver las propias intenciones
CREATE POLICY "intentions_select_own" 
ON public.convinter_profile_intentions FOR SELECT 
USING (auth.uid() = profile_id);

-- Ver intenciones de otros usuarios (para matching)
CREATE POLICY "intentions_select_others" 
ON public.convinter_profile_intentions FOR SELECT 
USING (active = true);

-- Insertar propias intenciones
CREATE POLICY "intentions_insert_own" 
ON public.convinter_profile_intentions FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- Actualizar propias intenciones
CREATE POLICY "intentions_update_own" 
ON public.convinter_profile_intentions FOR UPDATE 
USING (auth.uid() = profile_id);

-- Eliminar propias intenciones
CREATE POLICY "intentions_delete_own" 
ON public.convinter_profile_intentions FOR DELETE 
USING (auth.uid() = profile_id);

-- Detalles: Ver propios
CREATE POLICY "intention_details_select_own" 
ON public.convinter_intention_details FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.convinter_profile_intentions pi
    WHERE pi.id = intention_id AND pi.profile_id = auth.uid()
  )
);

-- Detalles: Ver de otros (para matching)
CREATE POLICY "intention_details_select_others" 
ON public.convinter_intention_details FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.convinter_profile_intentions pi
    WHERE pi.id = intention_id AND pi.active = true
  )
);

-- Detalles: Insertar propios
CREATE POLICY "intention_details_insert_own" 
ON public.convinter_intention_details FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.convinter_profile_intentions pi
    WHERE pi.id = intention_id AND pi.profile_id = auth.uid()
  )
);

-- Detalles: Actualizar propios
CREATE POLICY "intention_details_update_own" 
ON public.convinter_intention_details FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.convinter_profile_intentions pi
    WHERE pi.id = intention_id AND pi.profile_id = auth.uid()
  )
);

-- 8. Helper RPC para añadir/actualizar intenciones
CREATE OR REPLACE FUNCTION public.convinter_set_intention(
  p_intention_type text,
  p_is_primary boolean DEFAULT false,
  p_urgency text DEFAULT 'flexible',
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  intention_id uuid;
  valid_intention_type public.convinter_intention_type;
  valid_urgency public.convinter_urgency_level;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  -- Validar tipo de intención
  IF p_intention_type NOT IN ('seek_room', 'offer_room', 'seek_flatmate') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_INTENTION_TYPE');
  END IF;
  valid_intention_type := p_intention_type::public.convinter_intention_type;

  -- Validar urgencia
  IF p_urgency NOT IN ('urgent', 'soon', 'flexible', 'exploring') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_URGENCY');
  END IF;
  valid_urgency := p_urgency::public.convinter_urgency_level;

  -- Si es primaria, desprimarizar las demás
  IF p_is_primary THEN
    UPDATE public.convinter_profile_intentions
    SET is_primary = false
    WHERE profile_id = me AND is_primary = true;
  END IF;

  -- Insertar o actualizar intención
  INSERT INTO public.convinter_profile_intentions (
    profile_id, intention_type, is_primary, urgency, details, active
  ) VALUES (
    me, valid_intention_type, p_is_primary, valid_urgency, p_details, true
  )
  ON CONFLICT (profile_id, intention_type, active) 
  DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    urgency = EXCLUDED.urgency,
    details = EXCLUDED.details,
    updated_at = now()
  RETURNING id INTO intention_id;

  RETURN jsonb_build_object('ok', true, 'intention_id', intention_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_set_intention(text, boolean, text, jsonb) TO authenticated;

-- 9. Helper RPC para remover intención (soft delete)
CREATE OR REPLACE FUNCTION public.convinter_remove_intention(p_intention_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  valid_intention_type public.convinter_intention_type;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF p_intention_type NOT IN ('seek_room', 'offer_room', 'seek_flatmate') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_INTENTION_TYPE');
  END IF;
  valid_intention_type := p_intention_type::public.convinter_intention_type;

  -- Soft delete: marcar como inactiva
  UPDATE public.convinter_profile_intentions
  SET active = false, updated_at = now()
  WHERE profile_id = me AND intention_type = valid_intention_type AND active = true;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_remove_intention(text) TO authenticated;

-- 10. Helper RPC para obtener intenciones de un perfil
CREATE OR REPLACE FUNCTION public.convinter_get_intentions(p_profile_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_profile uuid;
  intentions jsonb;
BEGIN
  target_profile := COALESCE(p_profile_id, auth.uid());

  IF target_profile IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', pi.id,
      'intention_type', pi.intention_type,
      'is_primary', pi.is_primary,
      'priority', pi.priority,
      'urgency', pi.urgency,
      'details', pi.details,
      'created_at', pi.created_at
    )
  )
  INTO intentions
  FROM public.convinter_profile_intentions pi
  WHERE pi.profile_id = target_profile AND pi.active = true
  ORDER BY pi.is_primary DESC, pi.priority DESC;

  RETURN jsonb_build_object(
    'ok', true,
    'intentions', COALESCE(intentions, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_intentions(uuid) TO authenticated;

-- 11. Migrar datos existentes (si hay user_type en profiles antiguo)
-- Esto es opcional y depende de si tienes datos existentes
-- COMENTADO por seguridad - descomentar si necesitas migrar

/*
DO $$
DECLARE
  prof record;
BEGIN
  FOR prof IN SELECT id, user_type FROM public.profiles WHERE user_type IS NOT NULL LOOP
    INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, active)
    VALUES (prof.id, prof.user_type::text::public.convinter_intention_type, true, true)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
*/

-- 12. Comentarios en las tablas
COMMENT ON TABLE public.convinter_profile_intentions IS 
'Múltiples intenciones por perfil: seek_room, offer_room, seek_flatmate';

COMMENT ON TABLE public.convinter_intention_details IS 
'Detalles específicos según el tipo de intención';

COMMENT ON TYPE public.convinter_intention_type IS 
'Tipos de intención: seek_room (busco habitación), offer_room (ofrezco habitación), seek_flatmate (busco compañero)';

COMMENT ON TYPE public.convinter_urgency_level IS 
'Nivel de urgencia: urgent (<1 mes), soon (1-3 meses), flexible (3+ meses), exploring (explorando)';
