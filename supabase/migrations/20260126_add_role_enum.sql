-- Add role-based access control with multiple permission levels
-- This migration adds support for super_admin, admin, moderator, and viewer roles

-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'viewer');

-- Modify user_roles table to use the new enum
-- First, add a temporary column
ALTER TABLE user_roles ADD COLUMN role_new user_role;

-- Migrate existing data (all existing 'admin' roles stay as 'admin')
UPDATE user_roles SET role_new = 'admin'::user_role WHERE role = 'admin';

-- Drop old column and rename new one
ALTER TABLE user_roles DROP COLUMN role;
ALTER TABLE user_roles RENAME COLUMN role_new TO role;

-- Make role NOT NULL
ALTER TABLE user_roles ALTER COLUMN role SET NOT NULL;

-- Add comment
COMMENT ON TYPE user_role IS 'User permission levels: super_admin (full access), admin (manage reservations/reviews/prices), moderator (approve reviews only), viewer (read-only)';
