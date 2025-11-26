-- Create table for company/crew types
CREATE TABLE public.company_crew_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('company', 'crew')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, type)
);

-- Create table for roles linked to types
CREATE TABLE public.company_crew_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID REFERENCES public.company_crew_types(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_crew_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_crew_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_crew_types
CREATE POLICY "Only admins can view types"
  ON public.company_crew_types FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert types"
  ON public.company_crew_types FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update types"
  ON public.company_crew_types FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete types"
  ON public.company_crew_types FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for company_crew_roles
CREATE POLICY "Only admins can view roles"
  ON public.company_crew_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert roles"
  ON public.company_crew_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
  ON public.company_crew_roles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.company_crew_roles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_company_crew_types_updated_at
  BEFORE UPDATE ON public.company_crew_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_crew_roles_updated_at
  BEFORE UPDATE ON public.company_crew_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();