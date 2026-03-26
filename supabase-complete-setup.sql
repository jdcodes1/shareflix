-- Netflix Playlists: Complete Database Setup
-- Run this entire script in Supabase SQL Editor to set up everything from scratch

-- Step 1: Create playlists table with user authentication support
CREATE TABLE playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  movie_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Step 2: Create indexes for faster queries
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_user_id_updated ON playlists(user_id, updated_at DESC);
CREATE INDEX idx_playlists_public ON playlists(is_public) WHERE is_public = true;

-- Step 3: Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies

-- Public playlists are viewable by everyone
CREATE POLICY "Public playlists are viewable by everyone"
  ON playlists FOR SELECT
  USING (is_public = true);

-- Users can view their own playlists (even if not public)
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create owned playlists
CREATE POLICY "Authenticated users can create owned playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users can create anonymous playlists
CREATE POLICY "Anyone can create anonymous playlists"
  ON playlists FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Allow anonymous updates (for localStorage sync before auth)
-- This allows someone with the ID to update anonymous playlists
-- Remove this if you want stricter security
CREATE POLICY "Anonymous playlists can be updated"
  ON playlists FOR UPDATE
  USING (user_id IS NULL);

-- Setup complete!
-- Your database is now ready for both anonymous and authenticated users
