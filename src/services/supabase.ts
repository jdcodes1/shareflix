import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Playlist } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Create Supabase client (only if configured)
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database row type (snake_case from Postgres)
interface PlaylistRow {
  id: string;
  name: string;
  description: string;
  movie_ids: number[];
  created_at: number;
  updated_at: number;
  is_public: boolean;
  user_id: string | null;
}

// Convert DB row to app type
function rowToPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    movieIds: row.movie_ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPublic: row.is_public,
    userId: row.user_id,
  };
}

// Convert app type to DB row
function playlistToRow(playlist: Playlist): PlaylistRow {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    movie_ids: playlist.movieIds,
    created_at: playlist.createdAt,
    updated_at: playlist.updatedAt,
    is_public: playlist.isPublic,
    user_id: playlist.userId ?? null,
  };
}

// Fetch a public playlist by ID
export async function fetchPublicPlaylist(id: string): Promise<Playlist | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (error || !data) return null;
  return rowToPlaylist(data);
}

// Save/update a playlist to Supabase (upsert)
export async function savePlaylistToCloud(playlist: Playlist): Promise<boolean> {
  if (!supabase) return false;

  const row = playlistToRow(playlist);

  const { error } = await supabase.from('playlists').upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('Failed to save playlist to cloud:', error.message);
    return false;
  }

  return true;
}

// Delete a playlist from Supabase
export async function deletePlaylistFromCloud(id: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('playlists').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete playlist from cloud:', error.message);
    return false;
  }

  return true;
}

// Fetch all playlists for a specific user
export async function fetchUserPlaylists(userId: string): Promise<Playlist[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch user playlists:', error.message);
    return [];
  }

  return data.map(rowToPlaylist);
}

// Claim an anonymous playlist by setting its user_id
export async function claimPlaylist(playlistId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('playlists')
    .update({ user_id: userId })
    .eq('id', playlistId)
    .is('user_id', null); // Only claim if currently anonymous

  if (error) {
    console.error('Failed to claim playlist:', error.message);
    return false;
  }

  return true;
}
