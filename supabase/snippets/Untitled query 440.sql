-- Ver usuarios y perfiles
SELECT 
  au.email,
  au.id as auth_id,
  cp.user_id as profile_user_id,
  cp.display_name,
  cp.handle
FROM auth.users au
LEFT JOIN public.convinter_profiles cp ON au.id = cp.user_id
WHERE au.email IN ('carlos.martin@test.com', 'laura.fernandez@test.com', 'javier.lopez@test.com')
ORDER BY au.email;