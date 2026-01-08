-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS listings_select_own ON convinter_listings;

-- Owners can see ALL their listings (any status)
CREATE POLICY listings_select_owner 
ON convinter_listings FOR SELECT 
TO authenticated 
USING (auth.uid() = owner_id);

-- Authenticated users can see ACTIVE listings from others
CREATE POLICY listings_select_active 
ON convinter_listings FOR SELECT 
TO authenticated 
USING (status = 'active');