-- Supabase Database Setup for Product Penetration Calculator
-- Run this SQL in your Supabase SQL Editor to create the versions table

-- Create the versions table
CREATE TABLE IF NOT EXISTS versions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on timestamp for faster sorting
CREATE INDEX IF NOT EXISTS idx_versions_timestamp ON versions(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (public read/write)
-- For production, you may want to restrict this based on user authentication
CREATE POLICY "Allow public access to versions" ON versions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_versions_updated_at
  BEFORE UPDATE ON versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

