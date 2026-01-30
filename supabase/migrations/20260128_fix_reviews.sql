-- 1. Ensure RLS allows public inserts explicitly
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;

CREATE POLICY "Anyone can create reviews" ON public.reviews
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (
        char_length(guest_name) >= 2 AND
        char_length(comment) >= 10 AND
        rating >= 1 AND rating <= 5
    );

-- 2. Create Function to handle new review notifications
CREATE OR REPLACE FUNCTION public.handle_new_review()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_cabin_name TEXT;
BEGIN
    SELECT name_fa INTO v_cabin_name FROM public.cabins WHERE id = NEW.cabin_id;
    
    INSERT INTO public.notifications (type, title, message, metadata)
    VALUES (
        'new_review',
        'نظر جدید',
        format('نظر جدید از %s برای کلبه %s', NEW.guest_name, v_cabin_name),
        jsonb_build_object('review_id', NEW.id, 'cabin_id', NEW.cabin_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger (Drop if exists first to avoid errors)
DROP TRIGGER IF EXISTS on_new_review ON public.reviews;

CREATE TRIGGER on_new_review
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_review();
