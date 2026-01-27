-- ==============================================================================
-- RESET SCRIPT
-- WARNING: This will DELETE ALL RESERVATIONS and NOTIFICATIONS.
-- ==============================================================================

-- 1. Clear Notifications (Resets the "bell" count to 0)
TRUNCATE TABLE public.notifications CASCADE;

-- 2. Clear Reservations
-- CASCADE is used because other tables (like payments or reviews) might reference reservations.
-- Depending on your constraints, this might delete those related records too (which is usually desired for a "reset").
TRUNCATE TABLE public.reservations CASCADE;


-- NOTE on Logic:
-- The 'notifications' table is separate from 'reservations'.
-- When a reservation is created, a COPY of that event is sent to 'notifications'.
-- Deleting the reservation later does NOT automatically delete the notification copy.
-- That is why your count was out of sync. This script wipes both matching DBs.
