-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update profiles RLS policies to allow admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
);

-- Update company_profiles RLS policies to allow admin access
DROP POLICY IF EXISTS "Users can view their own company profile" ON public.company_profiles;
CREATE POLICY "Users can view their own company profile or admins can view all"
ON public.company_profiles
FOR SELECT
USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
);

-- Create the default admin user (password will be set via Supabase Auth)
-- Note: The actual user creation with email/password needs to be done via Supabase Auth UI or API
-- This migration prepares the role assignment