-- Add cleaning_status to cabins table
ALTER TABLE public.cabins
ADD COLUMN cleaning_status text NOT NULL DEFAULT 'clean'
CHECK (cleaning_status IN ('clean', 'dirty', 'cleaning'));

-- Add comment
COMMENT ON COLUMN public.cabins.cleaning_status IS 'Housekeeping status: clean, dirty, or cleaning';
