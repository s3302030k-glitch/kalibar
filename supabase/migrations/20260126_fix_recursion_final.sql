-- 1. پاک کردن تمام پالیسی‌های مشکل‌دار
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Staff can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- 2. ساخت توابع "امن" (SECURITY DEFINER)
-- این توابع با دسترسی سطح بالا اجرا میشن و لوپ RLS ایجاد نمی‌کنن
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff_safe()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'moderator', 'viewer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. اعمال پالیسی‌های جدید و امن

-- قانون ۱: هر کاربر فقط نقش خودش رو ببینه (بدون لوپ)
CREATE POLICY "Users can view own role" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- قانون ۲: ادمین‌ها همه نقش‌ها رو ببینن (با استفاده از تابع امن)
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.is_admin_safe());

-- قانون ۳: ادمین‌ها بتونن نقش‌ها رو تغییر بدن
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.is_admin_safe());

-- 4. اصلاح دسترسی رزروها (با تابع امن)
DROP POLICY IF EXISTS "Staff can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;

CREATE POLICY "Staff can view reservations" ON public.reservations
FOR SELECT USING (public.is_staff_safe());

CREATE POLICY "Admins can update reservations" ON public.reservations
FOR UPDATE USING (public.is_admin_safe());
