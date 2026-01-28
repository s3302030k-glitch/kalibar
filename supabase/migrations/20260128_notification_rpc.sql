CREATE OR REPLACE FUNCTION public.mark_notification_read_by_reference(
    p_record_id TEXT,
    p_type TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.notifications
    SET 
        is_read = TRUE,
        read_at = now(),
        read_by = auth.uid()
    WHERE 
        (metadata->>'reservation_id' = p_record_id OR metadata->>'review_id' = p_record_id)
        AND (p_type IS NULL OR type = p_type)
        AND is_read = false;
END;
$$;
