CREATE POLICY "Users can insert own supervisor profile"
ON public.supervisors FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());