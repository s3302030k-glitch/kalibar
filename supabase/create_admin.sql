-- ============================================
-- Create Admin User Script
-- ============================================
-- Run this AFTER creating a user through Supabase Auth
-- 
-- Steps:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > Set email and password
-- 3. Copy the user's UUID
-- 4. Replace 'YOUR_USER_UUID_HERE' below with the actual UUID
-- 5. Run this SQL in the SQL Editor

-- Option 1: Insert admin role directly
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_UUID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Option 2: If you know the email, you can do it in one query
-- (Replace 'admin@example.com' with your admin email)
/*
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- Verify the admin was created
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';
