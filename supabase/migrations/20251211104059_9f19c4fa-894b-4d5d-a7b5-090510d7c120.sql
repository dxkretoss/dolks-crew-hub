-- Create mentions table
CREATE TABLE public.mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Only admins can view mentions" 
ON public.mentions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert mentions" 
ON public.mentions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update mentions" 
ON public.mentions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete mentions" 
ON public.mentions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public select for app usage
CREATE POLICY "allow_select_on_mentions" 
ON public.mentions 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mentions_updated_at
BEFORE UPDATE ON public.mentions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();