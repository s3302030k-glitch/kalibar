-- Secure and fix permissions for get_cabin_booked_dates
-- This function is used by the public calendar to show booked dates without exposing user details

CREATE OR REPLACE FUNCTION public.get_cabin_booked_dates(p_cabin_id INTEGER)
RETURNS TABLE(check_in_date DATE, check_out_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT r.check_in_date, r.check_out_date
    FROM public.reservations r
    WHERE r.cabin_id = p_cabin_id
      AND r.status IN ('pending', 'pending_payment', 'confirmed');
END;
$$;

-- Explicitly grant execute permissions to anon (guest) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_cabin_booked_dates(INTEGER) TO anon, authenticated;

COMMENT ON FUNCTION public.get_cabin_booked_dates IS 'Returns booked date ranges for a cabin, accessible to public for calendar display (Secured)';
