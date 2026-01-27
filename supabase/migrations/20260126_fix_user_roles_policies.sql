-- Fix user_roles policies to allow users to view their own roles
-- This is needed for login to work properly

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create policy to allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Also ensure admins can view all roles (if not already exists)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT
  USING (public.is_admin());

-- Allow admins to manage roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL
  USING (public.is_admin());
