-- Create storage buckets for profile and listing photos
-- This migration creates the necessary storage infrastructure

-- 1. Create profile-photos bucket (CRITICAL - EditProfileSheet already uses it)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile-photos
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Create listing-photos bucket (HIGH PRIORITY - needed for CreateListing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for listing-photos
CREATE POLICY "Public read access for listing photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos');

CREATE POLICY "Authenticated users can upload listing photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own listing photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own listing photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Create verification buckets (MEDIUM PRIORITY - for future use)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-selfies',
  'verification-selfies',
  false, -- NOT public - only mods can see
  3145728, -- 3MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for verification-selfies
CREATE POLICY "Users can upload own verification selfies"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-selfies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own verification selfies"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-selfies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Moderators can read all verification selfies"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-selfies' AND
  EXISTS (SELECT 1 FROM public.convinter_moderators WHERE user_id = auth.uid())
);

-- 4. Create verification-docs bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  false, -- NOT public
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for verification-docs
CREATE POLICY "Users can upload own verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Moderators can read all verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' AND
  EXISTS (SELECT 1 FROM public.convinter_moderators WHERE user_id = auth.uid())
);

-- Note: After applying this migration, you may need to enable Realtime for storage in Supabase dashboard
