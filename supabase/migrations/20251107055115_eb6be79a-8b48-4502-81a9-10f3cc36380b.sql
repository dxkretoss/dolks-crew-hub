-- Add interest_type column to event_interests table
ALTER TABLE public.event_interests
ADD COLUMN interest_type TEXT NOT NULL DEFAULT 'yes' CHECK (interest_type IN ('yes', 'no', 'maybe'));

-- Add index for better performance
CREATE INDEX idx_event_interests_type ON public.event_interests(interest_type);