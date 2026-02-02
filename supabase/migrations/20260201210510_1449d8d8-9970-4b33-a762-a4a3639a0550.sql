-- Allow admin to view all user_profiles (needed for Admin → Usuários)
DROP POLICY IF EXISTS user_profiles_select_admin ON public.user_profiles;
CREATE POLICY user_profiles_select_admin
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
