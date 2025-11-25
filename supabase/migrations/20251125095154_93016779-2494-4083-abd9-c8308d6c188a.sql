-- Add is_approved column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_approved boolean DEFAULT false;

-- Update existing crew members to be approved (so existing accounts continue working)
UPDATE public.profiles 
SET is_approved = true 
WHERE user_type = 'crew';

-- Update existing service members to be auto-approved
UPDATE public.profiles 
SET is_approved = true 
WHERE user_type = 'service';

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.is_approved IS 'Indicates if a crew member account has been approved by admin. Service accounts are auto-approved.';