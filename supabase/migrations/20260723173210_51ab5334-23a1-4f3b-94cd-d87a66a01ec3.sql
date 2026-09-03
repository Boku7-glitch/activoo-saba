
-- Bucket is public, so image URLs still resolve via the CDN without an RLS SELECT.
-- Removing this broad SELECT policy prevents anon clients from listing the whole bucket.
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;
