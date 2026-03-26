-- Netflix Playlists: Authentication Migration
-- This migration adds user authentication support while maintaining anonymous playlist functionality

-- Step 1: Add user_id column (nullable for anonymous playlists)
ALTER TABLE playlists
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create indexes for faster user queries
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_user_id_updated ON playlists(user_id, updated_at DESC);

-- Step 3: Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public playlists readable" ON playlists;
DROP POLICY IF EXISTS "Anyone can insert" ON playlists;
DROP POLICY IF EXISTS "Anyone can update" ON playlists;

-- Step 4: Create new RLS policies

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

-- Migration complete!
-- Run this SQL in your Supabase SQL Editor to enable authentication
