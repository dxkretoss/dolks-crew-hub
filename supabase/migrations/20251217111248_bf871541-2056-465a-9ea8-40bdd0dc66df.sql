-- Add is_featured column to events table
ALTER TABLE public.events 
ADD COLUMN is_featured boolean DEFAULT false;