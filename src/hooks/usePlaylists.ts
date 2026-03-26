import { useQuery } from '@tanstack/react-query';
import { fetchUserPlaylists, fetchPublicPlaylist } from '../services/supabase';

// Hook for fetching user's playlists from Supabase
export function useUserPlaylists(userId: string | null) {
  const { data: playlists = [], isLoading: loading, error } = useQuery({
    queryKey: ['playlists', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await fetchUserPlaylists(userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });

  return { playlists, loading, error: error ? (error as Error).message : null };
}

// Hook for fetching a shared/public playlist
export function useSharedPlaylist(playlistId: string | null) {
  const { data: playlist = null, isLoading: loading, error } = useQuery({
    queryKey: ['playlists', 'shared', playlistId],
    queryFn: async () => {
      if (!playlistId) return null;
      return await fetchPublicPlaylist(playlistId);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!playlistId,
  });

  return { playlist, loading, error: error ? (error as Error).message : null };
}
