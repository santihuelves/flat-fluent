-- =====================================================================
-- BLOQUE 2 — Buckets de Storage faltantes
-- (profile-photos ya existe, no se vuelve a crear)
-- =====================================================================

-- listing-photos --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-photos','listing-photos', true, 5242880,
        ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for listing photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

CREATE POLICY "Authenticated users can upload listing photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own listing photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'listing-photos'
         AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own listing photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listing-photos'
         AND (storage.foldername(name))[1] = auth.uid()::text);

-- verification-selfies (privado) ---------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-selfies','verification-selfies', false, 3145728,
        ARRAY['image/jpeg','image/jpg','image/png'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own verification selfies"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-selfies'
              AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own verification selfies"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-selfies'
         AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Moderators can read all verification selfies"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-selfies'
         AND EXISTS (SELECT 1 FROM public.convinter_moderators WHERE user_id = auth.uid()));

-- verification-docs (privado) ------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-docs','verification-docs', false, 10485760,
        ARRAY['image/jpeg','image/jpg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-docs'
              AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own verification docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-docs'
         AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Moderators can read all verification docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-docs'
         AND EXISTS (SELECT 1 FROM public.convinter_moderators WHERE user_id = auth.uid()));
