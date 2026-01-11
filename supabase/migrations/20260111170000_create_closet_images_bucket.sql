-- ============================================
-- Migration: Create closet-images storage bucket with RLS
-- ============================================
-- Bucket structure: closet-images/{user_id}/{filename}
-- RLS ensures users can only access their own folder

-- 1. Create the bucket (private, not public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('closet-images', 'closet-images', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies
-- Path structure: {user_id}/{filename}
-- storage.foldername(name)[1] extracts the first folder (user_id)

-- SELECT: Users can only read their own files
CREATE POLICY "Users can read own closet images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'closet-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT: Users can only upload to their own folder
CREATE POLICY "Users can upload own closet images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'closet-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: Users can only update their own files
CREATE POLICY "Users can update own closet images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'closet-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can only delete their own files
CREATE POLICY "Users can delete own closet images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'closet-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
