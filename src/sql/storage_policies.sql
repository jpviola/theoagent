
-- Storage Policies for 'media' bucket
-- Note: Bucket creation is handled by scripts/setup-storage.ts or manually
-- We just need to ensure policies exist

-- Allow public read access to 'media' bucket
CREATE POLICY "Public Access Media" ON storage.objects 
  FOR SELECT 
  USING ( bucket_id = 'media' );

-- Allow authenticated users to upload to 'media' bucket
CREATE POLICY "Authenticated Upload Media" ON storage.objects 
  FOR INSERT 
  WITH CHECK ( bucket_id = 'media' AND auth.role() = 'authenticated' );

-- Allow users to update their own files (optional, depends on need)
CREATE POLICY "Users Update Own Media" ON storage.objects
  FOR UPDATE
  USING ( bucket_id = 'media' AND auth.uid() = owner );
