-- DANGER: This will delete ALL reservations!
TRUNCATE TABLE public.reservations CASCADE;

-- If you want to reset the ID sequence as well (optional):
-- ALTER SEQUENCE public.reservations_id_seq RESTART WITH 1;
