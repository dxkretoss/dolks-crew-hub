-- Add is_allowed column to events table for admin approval
ALTER TABLE public.events ADD COLUMN is_allowed boolean DEFAULT NULL;

-- Update RLS policies to allow admins to view and modify all events
CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all events"
ON public.events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all events"
ON public.events
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert events"
ON public.events
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update event_documents policies for admin access
CREATE POLICY "Admins can view all event documents"
ON public.event_documents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any event documents"
ON public.event_documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert event documents"
ON public.event_documents
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));