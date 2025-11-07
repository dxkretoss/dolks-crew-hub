-- Create event_interests table to track which users are interested in events
CREATE TABLE public.event_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;

-- Create policies for event_interests
CREATE POLICY "Users can view all event interests"
ON public.event_interests
FOR SELECT
USING (true);

CREATE POLICY "Users can add their own interest"
ON public.event_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own interest"
ON public.event_interests
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all event interests"
ON public.event_interests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_event_interests_event_id ON public.event_interests(event_id);
CREATE INDEX idx_event_interests_user_id ON public.event_interests(user_id);