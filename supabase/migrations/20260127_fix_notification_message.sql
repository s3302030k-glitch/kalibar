-- Drop the existing function first to avoid conflict with default parameters
DROP FUNCTION IF EXISTS public.create_reservation(INTEGER, TEXT, TEXT, TEXT, INTEGER, DATE, DATE, public.payment_method);

CREATE OR REPLACE FUNCTION public.create_reservation(
    p_cabin_id INTEGER,
    p_guest_name TEXT,
    p_guest_phone TEXT,
    p_guest_email TEXT,
    p_guests_count INTEGER,
    p_check_in DATE,
    p_check_out DATE,
    p_payment_method public.payment_method
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_available BOOLEAN;
    v_price RECORD;
    v_reservation_id UUID;
    v_cabin RECORD;
BEGIN
    -- 1. Validate inputs
    IF p_check_in < CURRENT_DATE THEN
        RAISE EXCEPTION 'Check-in date cannot be in the past';
    END IF;
    
    IF p_check_out <= p_check_in THEN
        RAISE EXCEPTION 'Check-out date must be after check-in date';
    END IF;

    -- 2. Check availability
    v_is_available := public.check_availability(p_cabin_id, p_check_in, p_check_out);
    IF NOT v_is_available THEN
        RAISE EXCEPTION 'Selected dates are not available';
    END IF;

    -- 3. Calculate price
    WITH prices AS (
        SELECT * FROM public.calculate_reservation_price(p_cabin_id, p_check_in, p_check_out)
    )
    SELECT * INTO v_price FROM prices;
    
    -- 4. Get cabin details for notification
    SELECT * INTO v_cabin FROM public.cabins WHERE id = p_cabin_id;

    -- 5. Create reservation
    INSERT INTO public.reservations (
        cabin_id,
        guest_name,
        guest_phone,
        guest_email,
        guests_count,
        check_in_date,
        check_out_date,
        -- nights_count is GENERATED, do not insert
        calculated_price_irr,
        calculated_price_usd,
        -- discount defaults to 0
        -- final_price is GENERATED, do not insert
        payment_method,
        status
    ) VALUES (
        p_cabin_id,
        p_guest_name,
        p_guest_phone,
        p_guest_email,
        p_guests_count,
        p_check_in,
        p_check_out,
        v_price.total_irr,
        v_price.total_usd,
        p_payment_method,
        CASE 
            WHEN p_payment_method = 'cash_on_arrival' THEN 'pending'::public.reservation_status
            ELSE 'pending_payment'::public.reservation_status
        END
    ) RETURNING id INTO v_reservation_id;

    -- 6. Create Notification
    INSERT INTO public.notifications (
        type,
        title,
        message,
        metadata
    ) VALUES (
        'new_reservation',
        'رزرو جدید',
        format('رزرو جدید از %s برای %s', p_guest_name, v_cabin.name_fa), -- Fixed: Removed explicit 'کلبه'
        jsonb_build_object('reservation_id', v_reservation_id, 'cabin_id', p_cabin_id)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'price_irr', v_price.total_irr,
        'price_usd', v_price.total_usd,
        'nights', v_price.nights
    );
END;
$$;
