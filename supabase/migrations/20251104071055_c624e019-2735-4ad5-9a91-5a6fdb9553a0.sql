-- Create company_services table
CREATE TABLE public.company_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_services (admin only)
CREATE POLICY "Only admins can view company services"
ON public.company_services
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert company services"
ON public.company_services
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update company services"
ON public.company_services
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete company services"
ON public.company_services
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_company_services_updated_at
BEFORE UPDATE ON public.company_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();