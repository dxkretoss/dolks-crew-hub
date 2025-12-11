-- Add policy for admins to delete any post
CREATE POLICY "Admins can delete all posts"
ON public.posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));