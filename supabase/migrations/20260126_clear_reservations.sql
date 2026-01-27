-- Clear all reservations to reset the system for testing
TRUNCATE TABLE public.reservations CASCADE;

-- Optional: Reset the sequence if your ID is serial (not needed for UUID)
-- ALTER SEQUENCE reservations_id_seq RESTART WITH 1;
