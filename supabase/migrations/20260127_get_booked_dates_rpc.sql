-- Function: Get booked dates for a cabin (Publicly accessible for calendar)
CREATE OR REPLACE FUNCTION public.get_cabin_booked_dates(
    p_cabin_id INTEGER
)
RETURNS TABLE(check_in_date DATE, check_out_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER -- Bylaws RLS
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT r.check_in_date, r.check_out_date
    FROM public.reservations r
    WHERE r.cabin_id = p_cabin_id
      AND r.status IN ('pending', 'pending_payment', 'confirmed');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_cabin_booked_dates(INTEGER) TO anon, authenticated;

-- Comment for documentation
COMMENT ON FUNCTION public.get_cabin_booked_dates IS 'Returns booked date ranges for a cabin, accessible to public for calendar display';
