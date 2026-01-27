-- =================================================================
-- Script to Grant Admin Access to Developer
-- Run this in your Supabase SQL Editor to fix RLS visibility issues.
-- =================================================================

-- 1. Insert/Update the user role for your email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'kalibar@gmail.com' -- Replace with your exact login email
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 2. Verify the result
SELECT u.email, r.role 
FROM auth.users u
JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email = 'kalibar@gmail.com';
