-- Add new columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS cover_picture text,
ADD COLUMN IF NOT EXISTS duration text,
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);