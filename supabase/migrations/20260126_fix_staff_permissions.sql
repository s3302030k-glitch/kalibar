-- 1. Create a helper function for ALL panel users (Staff)
-- This includes: super_admin, admin, moderator, viewer
CREATE OR REPLACE FUNCTION public.has_panel_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'moderator', 'viewer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Reservations Policy
-- Allow all staff to VIEW reservations
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
CREATE POLICY "Staff can view all reservations" ON public.reservations
  FOR SELECT USING (public.has_panel_access());

-- Keep UPDATE restricted to Admins only
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;
CREATE POLICY "Admins can update reservations" ON public.reservations
  FOR UPDATE USING (public.is_admin());

-- 3. Update Reviews Policy
-- Allow all staff to VIEW all reviews (even unapproved ones)
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (public.is_admin());

-- Add specific VIEW policy for Staff if not covered by public policies
CREATE POLICY "Staff can view all reviews" ON public.reviews
  FOR SELECT USING (public.has_panel_access());

-- 4. Update User Roles Policy
-- Critical for AuthContext to work properly
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Staff can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_panel_access());

-- 5. Update Notifications Policy
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (public.is_admin());
  
CREATE POLICY "Staff can view notifications" ON public.notifications
  FOR SELECT USING (public.has_panel_access());
