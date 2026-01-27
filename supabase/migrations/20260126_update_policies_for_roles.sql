-- Update RLS policies to support new role system
-- This fixes the issue where super_admin and other roles can't access data

-- Helper function to check if user has admin-level access
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old admin policies and create new ones

-- Reservations
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
CREATE POLICY "Admins can view all reservations" ON public.reservations
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;
CREATE POLICY "Admins can update reservations" ON public.reservations
  FOR UPDATE USING (public.is_admin());

-- Reviews
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (public.is_admin());

-- Cabins
DROP POLICY IF EXISTS "Admins can view all cabins" ON public.cabins;
CREATE POLICY "Admins can view all cabins" ON public.cabins
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage cabins" ON public.cabins;
CREATE POLICY "Admins can manage cabins" ON public.cabins
  FOR ALL USING (public.is_admin());

-- Seasonal Prices
DROP POLICY IF EXISTS "Admins can manage seasonal prices" ON public.seasonal_prices;
CREATE POLICY "Admins can manage seasonal prices" ON public.seasonal_prices
  FOR ALL USING (public.is_admin());

-- Daily Prices
DROP POLICY IF EXISTS "Admins can manage daily prices" ON public.daily_prices;
CREATE POLICY "Admins can manage daily prices" ON public.daily_prices
  FOR ALL USING (public.is_admin());

-- Notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (public.is_admin());

-- Settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (public.is_admin());

-- Blocked Dates
DROP POLICY IF EXISTS "Admins can manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Admins can manage blocked dates" ON public.blocked_dates
  FOR ALL USING (public.is_admin());

-- User Roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Audit Log
DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (public.is_admin());
