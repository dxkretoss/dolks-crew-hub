-- Add rejection_reason column to profiles table
ALTER TABLE public.profiles
ADD COLUMN rejection_reason text;