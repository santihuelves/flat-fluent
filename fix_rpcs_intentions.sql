-- ================================================
-- FIX: Crear RPCs para Sistema de Intenciones
-- Ejecutar este SQL en el Dashboard de Supabase
-- ================================================

-- 1. Helper RPC para añadir/actualizar intenciones
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

-- 2. Helper RPC para remover intención (soft delete)
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

-- 3. Helper RPC para obtener intenciones de un perfil
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

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ RPCs de intenciones creados exitosamente!';
  RAISE NOTICE '📋 Funciones disponibles:';
  RAISE NOTICE '  - convinter_set_intention(text, boolean, text, jsonb)';
  RAISE NOTICE '  - convinter_remove_intention(text)';
  RAISE NOTICE '  - convinter_get_intentions(uuid)';
END $$;
