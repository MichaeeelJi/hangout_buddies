-- Allow everyone to view participants (needed for counting and checking status)
CREATE POLICY "Participants are viewable by everyone" ON participants
  FOR SELECT USING (true);

-- Allow users to leave events (delete their own row)
CREATE POLICY "Users can leave events" ON participants
  FOR DELETE USING (auth.uid() = user_id);

-- Update profiles policy to allow public viewing (needed to see event organizers)
-- First, drop the restrictive policy if it exists (or we can just add a new broader one, but cleaner to replace)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
