-- Add foreign key constraint to event_interests table to link to profiles
-- First, let's ensure the relationship is properly defined
ALTER TABLE public.event_interests
ADD CONSTRAINT fk_event_interests_user_id
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;