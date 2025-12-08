-- Add status and rejection_reason columns to projects table for approval workflow
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add category_id for linking to categories
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);