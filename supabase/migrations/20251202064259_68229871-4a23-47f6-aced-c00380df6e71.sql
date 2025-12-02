-- Create job_requests table
CREATE TABLE public.job_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  job_short_description TEXT NOT NULL,
  job_category_type_ids UUID[] NOT NULL,
  job_category_names TEXT[] NOT NULL,
  job_urgency TEXT NOT NULL,
  job_full_description TEXT NOT NULL,
  job_start_date DATE NOT NULL,
  job_location TEXT NOT NULL,
  job_latitude TEXT NOT NULL,
  job_longitude TEXT NOT NULL,
  job_complete_date DATE NOT NULL,
  job_special_requirements TEXT NOT NULL,
  job_budget TEXT,
  job_documents_images TEXT[],
  job_tags_ids UUID[],
  job_tags_names TEXT[],
  job_consent BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own job requests
CREATE POLICY "Users can create their own job requests"
ON public.job_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own job requests
CREATE POLICY "Users can view their own job requests"
ON public.job_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all job requests
CREATE POLICY "Admins can view all job requests"
ON public.job_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all job requests (for approval/rejection)
CREATE POLICY "Admins can update all job requests"
ON public.job_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete job requests
CREATE POLICY "Admins can delete job requests"
ON public.job_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_requests_updated_at
BEFORE UPDATE ON public.job_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for job documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-documents', 'job-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job documents
CREATE POLICY "Users can upload their own job documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own job documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'job-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all job documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'job-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Job documents are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'job-documents');