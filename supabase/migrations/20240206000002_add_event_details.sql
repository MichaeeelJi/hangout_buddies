
-- Add new columns for enhanced filtering and display
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create an index on city for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
