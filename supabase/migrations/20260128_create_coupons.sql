-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT coupons_code_check CHECK (char_length(code) >= 3)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can do everything on coupons" ON public.coupons;
CREATE POLICY "Admins can do everything on coupons" ON public.coupons
    FOR ALL TO authenticated
    USING (public.is_admin());

-- Add coupon_code to reservations if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'coupon_code') THEN
        ALTER TABLE public.reservations ADD COLUMN coupon_code TEXT;
    END IF;
END $$;

-- RPC to validate coupon (Public)
CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code TEXT,
    p_total_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_coupon RECORD;
    v_discount NUMERIC;
    v_final_price NUMERIC;
BEGIN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = UPPER(p_code)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'message', 'کد تخفیف نامعتبر یا منقضی شده است');
    END IF;

    IF v_coupon.discount_type = 'percent' THEN
        v_discount := (p_total_amount * v_coupon.discount_value) / 100;
    ELSE
        v_discount := v_coupon.discount_value;
    END IF;

    IF v_discount > p_total_amount THEN
        v_discount := p_total_amount;
    END IF;

    v_final_price := p_total_amount - v_discount;

    RETURN jsonb_build_object(
        'valid', true, 
        'code', v_coupon.code, 
        'discount_amount', v_discount, 
        'final_price', v_final_price,
        'type', v_coupon.discount_type,
        'value', v_coupon.discount_value
    );
END;
$$;

-- Drop old create_reservation to update signature
DROP FUNCTION IF EXISTS public.create_reservation(INTEGER, TEXT, TEXT, TEXT, INTEGER, DATE, DATE, public.payment_method);
DROP FUNCTION IF EXISTS public.create_reservation(INTEGER, TEXT, TEXT, TEXT, INTEGER, DATE, DATE, public.payment_method, TEXT);


-- Revised create_reservation with Coupon Support
CREATE OR REPLACE FUNCTION public.create_reservation(
    p_cabin_id INTEGER,
    p_guest_name TEXT,
    p_guest_phone TEXT,
    p_guest_email TEXT,
    p_guests_count INTEGER,
    p_check_in DATE,
    p_check_out DATE,
    p_payment_method public.payment_method,
    p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_available BOOLEAN;
    v_price RECORD;
    v_reservation_id UUID;
    v_cabin RECORD;
    v_coupon RECORD;
    v_discount_irr NUMERIC := 0;
    v_discount_usd NUMERIC := 0;
BEGIN
    -- 1. Validate inputs
    IF p_check_in < CURRENT_DATE THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_CHECK_IN_DATE');
    END IF;
    
    IF p_check_out <= p_check_in THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_DATE_RANGE');
    END IF;

    -- 2. Check availability
    v_is_available := public.check_availability(p_cabin_id, p_check_in, p_check_out);
    IF NOT v_is_available THEN
        RETURN jsonb_build_object('success', false, 'error', 'DATES_NOT_AVAILABLE');
    END IF;

    -- 3. Calculate price
    WITH prices AS (
        SELECT * FROM public.calculate_reservation_price(p_cabin_id, p_check_in, p_check_out)
    )
    SELECT * INTO v_price FROM prices;
    
    -- 4. Apply Coupon if provided
    IF p_coupon_code IS NOT NULL AND LENGTH(p_coupon_code) > 0 THEN
        SELECT * INTO v_coupon
        FROM public.coupons
        WHERE code = UPPER(p_coupon_code)
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR used_count < max_uses);

        IF FOUND THEN
            -- Calculate discount
            IF v_coupon.discount_type = 'percent' THEN
                v_discount_irr := (v_price.total_irr * v_coupon.discount_value) / 100;
                v_discount_usd := (v_price.total_usd * v_coupon.discount_value) / 100;
            ELSE -- Fixed amount (assumed IRR)
                v_discount_irr := v_coupon.discount_value;
                -- For USD, we should ideally convert, but for now let's keep it 0 or approx? 
                -- Let's assume fixed coupons are IRR only for now to avoid complexity without exchange rate.
                v_discount_usd := 0; 
            END IF;

            -- Increment usage
            UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
        END IF;
    END IF;

    -- Cap discount
    IF v_discount_irr > v_price.total_irr THEN v_discount_irr := v_price.total_irr; END IF;
    IF v_discount_usd > v_price.total_usd THEN v_discount_usd := v_price.total_usd; END IF;

    -- 5. Get cabin details for notification
    SELECT * INTO v_cabin FROM public.cabins WHERE id = p_cabin_id;

    -- 6. Create reservation
    INSERT INTO public.reservations (
        cabin_id,
        guest_name,
        guest_phone,
        guest_email,
        guests_count,
        check_in_date,
        check_out_date,
        calculated_price_irr,
        calculated_price_usd,
        discount_amount_irr,
        discount_amount_usd,
        coupon_code,
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
        v_discount_irr,
        v_discount_usd,
        p_coupon_code,
        p_payment_method,
        CASE 
            WHEN p_payment_method = 'cash_on_arrival' THEN 'pending'::public.reservation_status
            ELSE 'pending_payment'::public.reservation_status
        END
    ) RETURNING id INTO v_reservation_id;

    -- 7. Create Notification
    INSERT INTO public.notifications (
        type,
        title,
        message,
        metadata
    ) VALUES (
        'new_reservation',
        'رزرو جدید',
        format('رزرو جدید از %s برای %s', p_guest_name, v_cabin.name_fa),
        jsonb_build_object('reservation_id', v_reservation_id, 'cabin_id', p_cabin_id)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'price_irr', v_price.total_irr,
        'price_usd', v_price.total_usd,
        'discount_irr', v_discount_irr,
        'nights', v_price.nights
    );
END;
$$;
