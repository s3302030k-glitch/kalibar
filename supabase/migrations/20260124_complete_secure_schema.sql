-- ============================================
-- Arasbaran Forest Lodge - Complete Database Schema
-- Version: 2.0.0
-- Date: 2026-01-24
-- Security: Enhanced RLS policies
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Reservation status
CREATE TYPE public.reservation_status AS ENUM (
    'pending',           -- در انتظار تأیید
    'pending_payment',   -- در انتظار پرداخت
    'confirmed',         -- تأیید شده
    'cancelled',         -- لغو شده
    'completed'          -- اتمام اقامت
);

-- Payment method
CREATE TYPE public.payment_method AS ENUM (
    'online_zarinpal',   -- پرداخت آنلاین زرین‌پال
    'online_paypal',     -- PayPal
    'crypto_usdt',       -- USDT TRC20
    'cash_on_arrival'    -- پرداخت در محل
);

-- Payment status
CREATE TYPE public.payment_status AS ENUM (
    'unpaid',            -- پرداخت نشده
    'pending',           -- در انتظار تأیید
    'paid',              -- پرداخت شده
    'refunded',          -- برگشت داده شده
    'failed'             -- ناموفق
);

-- Season type
CREATE TYPE public.season_type AS ENUM (
    'off_season',        -- فصل کم‌رونق
    'regular',           -- عادی
    'high_season',       -- فصل پر رونق
    'peak',              -- اوج (عید، تعطیلات)
    'special'            -- مناسبت‌های خاص
);

-- ============================================
-- TABLES
-- ============================================

-- 1. User Roles Table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 2. Cabins Table (کلبه‌ها)
CREATE TABLE public.cabins (
    id SERIAL PRIMARY KEY,
    name_fa TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description_fa TEXT,
    description_en TEXT,
    size_sqm INTEGER NOT NULL CHECK (size_sqm > 0),
    capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 10),
    base_price_irr BIGINT NOT NULL CHECK (base_price_irr >= 0),
    base_price_usd DECIMAL(10,2) NOT NULL CHECK (base_price_usd >= 0),
    images TEXT[] DEFAULT '{}',
    features_fa TEXT[] DEFAULT '{}',
    features_en TEXT[] DEFAULT '{}',
    amenities JSONB DEFAULT '{}',
    is_available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Seasonal Prices (قیمت‌های فصلی)
CREATE TABLE public.seasonal_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabin_id INTEGER REFERENCES public.cabins(id) ON DELETE CASCADE NOT NULL,
    season_name_fa TEXT NOT NULL,
    season_name_en TEXT NOT NULL,
    season_type season_type NOT NULL DEFAULT 'regular',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_irr BIGINT NOT NULL CHECK (price_irr >= 0),
    price_usd DECIMAL(10,2) NOT NULL CHECK (price_usd >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 4. Daily Price Overrides (قیمت‌های روزانه خاص)
CREATE TABLE public.daily_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabin_id INTEGER REFERENCES public.cabins(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price_irr BIGINT NOT NULL CHECK (price_irr >= 0),
    price_usd DECIMAL(10,2) NOT NULL CHECK (price_usd >= 0),
    reason_fa TEXT,
    reason_en TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT false, -- اگر true باشد این روز قابل رزرو نیست
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cabin_id, date)
);

-- 5. Reservations Table (رزروها)
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabin_id INTEGER REFERENCES public.cabins(id) ON DELETE RESTRICT NOT NULL,
    
    -- Guest Information
    guest_name TEXT NOT NULL CHECK (char_length(guest_name) >= 2 AND char_length(guest_name) <= 100),
    guest_phone TEXT NOT NULL CHECK (char_length(guest_phone) >= 10 AND char_length(guest_phone) <= 20),
    guest_email TEXT,
    guest_national_id TEXT, -- کد ملی (اختیاری)
    guests_count INTEGER NOT NULL CHECK (guests_count > 0 AND guests_count <= 10),
    
    -- Dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights_count INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    
    -- Pricing (calculated by server, NOT from client!)
    calculated_price_irr BIGINT NOT NULL CHECK (calculated_price_irr >= 0),
    calculated_price_usd DECIMAL(10,2) NOT NULL CHECK (calculated_price_usd >= 0),
    discount_amount_irr BIGINT DEFAULT 0,
    discount_amount_usd DECIMAL(10,2) DEFAULT 0,
    final_price_irr BIGINT GENERATED ALWAYS AS (calculated_price_irr - COALESCE(discount_amount_irr, 0)) STORED,
    final_price_usd DECIMAL(10,2) GENERATED ALWAYS AS (calculated_price_usd - COALESCE(discount_amount_usd, 0)) STORED,
    
    -- Payment
    payment_method payment_method NOT NULL DEFAULT 'cash_on_arrival',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    payment_reference TEXT, -- شماره پیگیری/تراکنش
    payment_verified_at TIMESTAMPTZ,
    payment_verified_by UUID REFERENCES auth.users(id),
    
    -- Status
    status reservation_status NOT NULL DEFAULT 'pending',
    
    -- Admin
    admin_notes TEXT,
    internal_notes TEXT, -- یادداشت‌های داخلی (فقط ادمین می‌بیند)
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_reservation_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_future_checkin CHECK (check_in_date >= CURRENT_DATE)
);

-- 6. Reviews Table (نظرات)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabin_id INTEGER REFERENCES public.cabins(id) ON DELETE CASCADE NOT NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    
    guest_name TEXT NOT NULL CHECK (char_length(guest_name) >= 2),
    guest_phone TEXT, -- برای تأیید اینکه واقعاً مهمان بوده
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL CHECK (char_length(comment) >= 10 AND char_length(comment) <= 2000),
    
    -- ادمین می‌تواند پاسخ دهد
    admin_response TEXT,
    admin_response_at TIMESTAMPTZ,
    
    is_approved BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false, -- نمایش در صفحه اصلی
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Notifications Table (اعلان‌ها برای پنل ادمین)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'new_reservation', 'new_review', 'payment_received', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- reservation_id, review_id, etc.
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    read_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Settings Table (تنظیمات سایت)
CREATE TABLE public.settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 9. Blocked Dates Table (روزهای بسته - برای همه کلبه‌ها)
CREATE TABLE public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    reason_fa TEXT,
    reason_en TEXT,
    cabin_id INTEGER REFERENCES public.cabins(id) ON DELETE CASCADE, -- NULL = همه کلبه‌ها
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (date, cabin_id)
);

-- 10. Audit Log (لاگ تغییرات)
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_reservations_cabin_dates ON public.reservations(cabin_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_created ON public.reservations(created_at DESC);
CREATE INDEX idx_seasonal_prices_dates ON public.seasonal_prices(cabin_id, start_date, end_date);
CREATE INDEX idx_daily_prices_date ON public.daily_prices(cabin_id, date);
CREATE INDEX idx_reviews_approved ON public.reviews(is_approved, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(is_read, created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$;

-- Function: Get price for a specific date
CREATE OR REPLACE FUNCTION public.get_price_for_date(
    p_cabin_id INTEGER,
    p_date DATE
)
RETURNS TABLE(price_irr BIGINT, price_usd DECIMAL(10,2))
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_daily_price RECORD;
    v_seasonal_price RECORD;
    v_base_price RECORD;
BEGIN
    -- 1. First check daily override
    SELECT dp.price_irr, dp.price_usd INTO v_daily_price
    FROM public.daily_prices dp
    WHERE dp.cabin_id = p_cabin_id AND dp.date = p_date AND NOT dp.is_blocked
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT v_daily_price.price_irr, v_daily_price.price_usd;
        RETURN;
    END IF;
    
    -- 2. Then check seasonal price
    SELECT sp.price_irr, sp.price_usd INTO v_seasonal_price
    FROM public.seasonal_prices sp
    WHERE sp.cabin_id = p_cabin_id 
      AND p_date BETWEEN sp.start_date AND sp.end_date
      AND sp.is_active
    ORDER BY sp.season_type DESC -- Peak has priority over regular
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT v_seasonal_price.price_irr, v_seasonal_price.price_usd;
        RETURN;
    END IF;
    
    -- 3. Fall back to base price
    SELECT c.base_price_irr, c.base_price_usd INTO v_base_price
    FROM public.cabins c
    WHERE c.id = p_cabin_id;
    
    RETURN QUERY SELECT v_base_price.base_price_irr, v_base_price.base_price_usd;
END;
$$;

-- Function: Calculate total price for a reservation
CREATE OR REPLACE FUNCTION public.calculate_reservation_price(
    p_cabin_id INTEGER,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS TABLE(total_irr BIGINT, total_usd DECIMAL(10,2), nights INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_date DATE;
    v_total_irr BIGINT := 0;
    v_total_usd DECIMAL(10,2) := 0;
    v_day_price RECORD;
    v_nights INTEGER;
BEGIN
    v_nights := p_check_out - p_check_in;
    v_current_date := p_check_in;
    
    WHILE v_current_date < p_check_out LOOP
        SELECT * INTO v_day_price FROM public.get_price_for_date(p_cabin_id, v_current_date);
        v_total_irr := v_total_irr + v_day_price.price_irr;
        v_total_usd := v_total_usd + v_day_price.price_usd;
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN QUERY SELECT v_total_irr, v_total_usd, v_nights;
END;
$$;

-- Function: Check if dates are available (preventing double booking)
CREATE OR REPLACE FUNCTION public.check_availability(
    p_cabin_id INTEGER,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conflict_count INTEGER;
    v_blocked_count INTEGER;
BEGIN
    -- Check for overlapping reservations
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.reservations r
    WHERE r.cabin_id = p_cabin_id
      AND r.status IN ('pending', 'pending_payment', 'confirmed')
      AND r.id IS DISTINCT FROM p_exclude_reservation_id
      AND (
          (p_check_in < r.check_out_date AND p_check_out > r.check_in_date)
      );
    
    IF v_conflict_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for blocked dates
    SELECT COUNT(*) INTO v_blocked_count
    FROM public.blocked_dates bd
    WHERE (bd.cabin_id = p_cabin_id OR bd.cabin_id IS NULL)
      AND bd.date >= p_check_in AND bd.date < p_check_out;
    
    IF v_blocked_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for daily_prices blocks
    SELECT COUNT(*) INTO v_blocked_count
    FROM public.daily_prices dp
    WHERE dp.cabin_id = p_cabin_id
      AND dp.is_blocked = TRUE
      AND dp.date >= p_check_in AND dp.date < p_check_out;
    
    RETURN v_blocked_count = 0;
END;
$$;

-- Function: Create reservation securely (main entry point)
CREATE OR REPLACE FUNCTION public.create_reservation(
    p_cabin_id INTEGER,
    p_guest_name TEXT,
    p_guest_phone TEXT,
    p_guest_email TEXT,
    p_guests_count INTEGER,
    p_check_in DATE,
    p_check_out DATE,
    p_payment_method payment_method DEFAULT 'cash_on_arrival'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_price RECORD;
    v_reservation_id UUID;
    v_cabin RECORD;
BEGIN
    -- Validate cabin exists and is available
    SELECT * INTO v_cabin FROM public.cabins WHERE id = p_cabin_id AND is_available = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'CABIN_NOT_AVAILABLE');
    END IF;
    
    -- Validate guest count
    IF p_guests_count > v_cabin.capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'EXCEEDS_CAPACITY');
    END IF;
    
    -- Validate dates
    IF p_check_in < CURRENT_DATE THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_CHECK_IN_DATE');
    END IF;
    
    IF p_check_out <= p_check_in THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_DATE_RANGE');
    END IF;
    
    -- Check availability with lock to prevent race conditions
    PERFORM pg_advisory_xact_lock(hashtext('reservation_' || p_cabin_id::text));
    
    IF NOT public.check_availability(p_cabin_id, p_check_in, p_check_out) THEN
        RETURN jsonb_build_object('success', false, 'error', 'DATES_NOT_AVAILABLE');
    END IF;
    
    -- Calculate price server-side
    SELECT * INTO v_price FROM public.calculate_reservation_price(p_cabin_id, p_check_in, p_check_out);
    
    -- Create reservation
    INSERT INTO public.reservations (
        cabin_id, guest_name, guest_phone, guest_email, guests_count,
        check_in_date, check_out_date,
        calculated_price_irr, calculated_price_usd,
        payment_method, status
    ) VALUES (
        p_cabin_id, p_guest_name, p_guest_phone, p_guest_email, p_guests_count,
        p_check_in, p_check_out,
        v_price.total_irr, v_price.total_usd,
        p_payment_method,
        CASE 
            WHEN p_payment_method = 'cash_on_arrival' THEN 'pending'::reservation_status
            ELSE 'pending_payment'::reservation_status
        END
    ) RETURNING id INTO v_reservation_id;
    
    -- Create notification for admin
    INSERT INTO public.notifications (type, title, message, metadata)
    VALUES (
        'new_reservation',
        'رزرو جدید',
        format('رزرو جدید از %s برای کلبه %s', p_guest_name, v_cabin.name_fa),
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_cabins_updated_at BEFORE UPDATE ON public.cabins
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_seasonal_prices_updated_at BEFORE UPDATE ON public.seasonal_prices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- user_roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL TO authenticated USING (public.is_admin());

-- cabins policies (everyone can read, admin can edit)
CREATE POLICY "Anyone can view available cabins" ON public.cabins
    FOR SELECT USING (is_available = TRUE);

CREATE POLICY "Admins can view all cabins" ON public.cabins
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can manage cabins" ON public.cabins
    FOR ALL TO authenticated USING (public.is_admin());

-- seasonal_prices policies
CREATE POLICY "Anyone can view active seasonal prices" ON public.seasonal_prices
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage seasonal prices" ON public.seasonal_prices
    FOR ALL TO authenticated USING (public.is_admin());

-- daily_prices policies
CREATE POLICY "Anyone can view daily prices" ON public.daily_prices
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage daily prices" ON public.daily_prices
    FOR ALL TO authenticated USING (public.is_admin());

-- reservations policies
-- NOTE: We use the create_reservation function for inserts, not direct INSERT
CREATE POLICY "Users can view their own reservations" ON public.reservations
    FOR SELECT USING (guest_phone = current_setting('app.user_phone', TRUE));

CREATE POLICY "Admins can view all reservations" ON public.reservations
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update reservations" ON public.reservations
    FOR UPDATE TO authenticated USING (public.is_admin());

-- reviews policies
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
    FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Anyone can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (
        char_length(guest_name) >= 2 AND
        char_length(comment) >= 10 AND
        rating >= 1 AND rating <= 5
    );

CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL TO authenticated USING (public.is_admin());

-- notifications policies
CREATE POLICY "Admins can manage notifications" ON public.notifications
    FOR ALL TO authenticated USING (public.is_admin());

-- settings policies
CREATE POLICY "Anyone can view settings" ON public.settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage settings" ON public.settings
    FOR ALL TO authenticated USING (public.is_admin());

-- blocked_dates policies
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage blocked dates" ON public.blocked_dates
    FOR ALL TO authenticated USING (public.is_admin());

-- audit_log policies
CREATE POLICY "Admins can view audit log" ON public.audit_log
    FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
    ('site_name', '{"fa": "اقامتگاه جنگلی ارسباران", "en": "Arasbaran Forest Lodge"}', 'Site name'),
    ('contact_phone', '"09123456789"', 'Contact phone number'),
    ('contact_email', '"info@arasbaran.lodge"', 'Contact email'),
    ('contact_address', '{"fa": "آذربایجان شرقی، کلیبر، جنگل‌های ارسباران", "en": "East Azerbaijan, Kaleybar, Arasbaran Forests"}', 'Address'),
    ('social_instagram', '""', 'Instagram handle'),
    ('social_telegram', '""', 'Telegram channel'),
    ('check_in_time', '"14:00"', 'Check-in time'),
    ('check_out_time', '"12:00"', 'Check-out time'),
    ('crypto_usdt_address', '""', 'USDT TRC20 wallet address'),
    ('min_nights', '1', 'Minimum nights per reservation'),
    ('max_nights', '30', 'Maximum nights per reservation'),
    ('advance_booking_days', '90', 'How many days ahead can be booked');

-- Insert initial cabins (same as current data)
INSERT INTO public.cabins (name_fa, name_en, slug, size_sqm, capacity, base_price_irr, base_price_usd, features_fa, features_en, is_available, sort_order) VALUES
    ('کلبه بلوط', 'Oak Cabin', 'oak', 60, 2, 1500000, 30.00, 
     ARRAY['تخت دو نفره', 'حمام اختصاصی', 'تراس جنگلی'],
     ARRAY['Double bed', 'Private bathroom', 'Forest terrace'],
     TRUE, 1),
    ('کلبه افرا', 'Maple Cabin', 'maple', 60, 2, 1500000, 30.00,
     ARRAY['تخت دو نفره', 'حمام اختصاصی', 'منظره کوهستان'],
     ARRAY['Double bed', 'Private bathroom', 'Mountain view'],
     TRUE, 2),
    ('کلبه سرو', 'Cypress Cabin', 'cypress', 60, 3, 1600000, 32.00,
     ARRAY['تخت دو نفره + یک نفره', 'حمام اختصاصی', 'آشپزخانه کوچک'],
     ARRAY['Double + single bed', 'Private bathroom', 'Small kitchen'],
     FALSE, 3),
    ('کلبه نارون', 'Elm Cabin', 'elm', 60, 2, 1500000, 30.00,
     ARRAY['تخت دو نفره', 'حمام اختصاصی', 'شومینه'],
     ARRAY['Double bed', 'Private bathroom', 'Fireplace'],
     TRUE, 4),
    ('کلبه گردو', 'Walnut Cabin', 'walnut', 60, 3, 1600000, 32.00,
     ARRAY['تخت دو نفره + یک نفره', 'حمام اختصاصی', 'تراس بزرگ'],
     ARRAY['Double + single bed', 'Private bathroom', 'Large terrace'],
     TRUE, 5),
    ('کلبه زربین', 'Juniper Cabin', 'juniper', 60, 2, 1500000, 30.00,
     ARRAY['تخت دو نفره', 'حمام اختصاصی', 'باربیکیو'],
     ARRAY['Double bed', 'Private bathroom', 'BBQ'],
     TRUE, 6),
    ('کلبه ویلایی کاج', 'Pine Villa', 'pine-villa', 110, 5, 2800000, 56.00,
     ARRAY['دو اتاق خواب', 'آشپزخانه کامل', 'سالن بزرگ', 'تراس جنگلی'],
     ARRAY['Two bedrooms', 'Full kitchen', 'Large lounge', 'Forest terrace'],
     TRUE, 7),
    ('کلبه ویلایی صنوبر', 'Poplar Villa', 'poplar-villa', 110, 6, 3000000, 60.00,
     ARRAY['دو اتاق خواب', 'آشپزخانه کامل', 'شومینه', 'جکوزی'],
     ARRAY['Two bedrooms', 'Full kitchen', 'Fireplace', 'Jacuzzi'],
     TRUE, 8),
    ('کلبه ویلایی راش', 'Beech Villa', 'beech-villa', 110, 5, 2800000, 56.00,
     ARRAY['دو اتاق خواب', 'آشپزخانه کامل', 'باربیکیو', 'پارکینگ'],
     ARRAY['Two bedrooms', 'Full kitchen', 'BBQ', 'Parking'],
     FALSE, 9),
    ('کلبه ویلایی توسکا', 'Alder Villa', 'alder-villa', 110, 6, 3200000, 64.00,
     ARRAY['سه اتاق خواب', 'آشپزخانه کامل', 'سالن بزرگ', 'محوطه اختصاصی'],
     ARRAY['Three bedrooms', 'Full kitchen', 'Large lounge', 'Private garden'],
     TRUE, 10);

-- Insert sample seasonal prices (Nowruz peak season)
INSERT INTO public.seasonal_prices (cabin_id, season_name_fa, season_name_en, season_type, start_date, end_date, price_irr, price_usd)
SELECT 
    c.id,
    'نوروز ۱۴۰۵',
    'Nowruz 1405',
    'peak'::season_type,
    '2026-03-20'::date,
    '2026-04-05'::date,
    ROUND(c.base_price_irr * 1.5)::bigint,
    ROUND(c.base_price_usd * 1.5, 2)
FROM public.cabins c;

-- Insert sample seasonal prices (Summer high season)
INSERT INTO public.seasonal_prices (cabin_id, season_name_fa, season_name_en, season_type, start_date, end_date, price_irr, price_usd)
SELECT 
    c.id,
    'تابستان',
    'Summer',
    'high_season'::season_type,
    '2026-06-01'::date,
    '2026-09-01'::date,
    ROUND(c.base_price_irr * 1.25)::bigint,
    ROUND(c.base_price_usd * 1.25, 2)
FROM public.cabins c;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Allow anonymous users to call certain functions
GRANT EXECUTE ON FUNCTION public.check_availability TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_reservation_price TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_price_for_date TO anon, authenticated;

-- ============================================
-- Enable Realtime for notifications
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
