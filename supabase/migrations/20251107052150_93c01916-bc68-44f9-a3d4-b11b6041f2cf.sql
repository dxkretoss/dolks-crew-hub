-- Add meeting_url column to events table
ALTER TABLE public.events ADD COLUMN meeting_url text;

COMMENT ON COLUMN public.events.meeting_url IS 'Meeting URL for online events';