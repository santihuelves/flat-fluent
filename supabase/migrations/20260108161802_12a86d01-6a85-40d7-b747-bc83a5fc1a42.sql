-- Usuarios autenticados pueden ver perfiles públicos/registered_only
CREATE POLICY profiles_select_public 
ON convinter_profiles FOR SELECT 
TO authenticated 
USING (visibility IN ('public', 'registered_only'));