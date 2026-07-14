import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Playlist } from '../types';
import {
  savePlaylistToCloud,
  deletePlaylistFromCloud,
  fetchPublicPlaylist,
  fetchUserPlaylists,
  isSupabaseConfigured,
} from '../services/supabase';
import { queryClient } from '../lib/queryClient';
import { addMovieId, removeMovieId, mergePlaylists } from './playlistHelpers';

// BroadcastChannel for real-time sync across browser tabs
const CHANNEL_NAME = 'netflix-playlists-sync';
let broadcastChannel: BroadcastChannel | null = null;

interface SyncMessage {
  type: 'PLAYLIST_UPDATE' | 'PLAYLIST_CREATE' | 'PLAYLIST_DELETE' | 'MOVIE_ADD' | 'MOVIE_REMOVE' | 'MOVIE_REORDER';
  payload: unknown;
  timestamp: number;
  tabId: string;
}

const TAB_ID = nanoid(8);

function initBroadcastChannel(onMessage: (msg: SyncMessage) => void) {
  if (typeof BroadcastChannel === 'undefined') return;

  broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
    // Ignore messages from same tab
    if (event.data.tabId === TAB_ID) return;
    onMessage(event.data);
  };
}

function broadcast(type: SyncMessage['type'], payload: unknown) {
  if (!broadcastChannel) return;
  const message: SyncMessage = {
    type,
    payload,
    timestamp: Date.now(),
    tabId: TAB_ID,
  };
  broadcastChannel.postMessage(message);
}

interface PlaylistState {
  playlists: Playlist[];
  activePlaylistId: string | null;
  isCollaborativeMode: boolean;

  // Actions
  createPlaylist: (name: string, description?: string) => string;
  deletePlaylist: (id: string) => void;
  updatePlaylist: (id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => void;

  addMovieToPlaylist: (playlistId: string, movieId: number) => void;
  removeMovieFromPlaylist: (playlistId: string, movieId: number) => void;
  reorderMoviesInPlaylist: (playlistId: string, movieIds: number[]) => void;

  setActivePlaylist: (id: string | null) => void;
  getPlaylistById: (id: string) => Playlist | undefined;
  duplicatePlaylist: (id: string) => string | null;

  // Collaborative mode
  enableCollaborativeMode: () => void;
  disableCollaborativeMode: () => void;

  // Cloud sync actions
  sharePlaylist: (playlistId: string) => Promise<string | null>;
  fetchSharedPlaylist: (id: string) => Promise<Playlist | null>;
  importSharedPlaylist: (playlist: Playlist) => void;

  // User-specific actions
  syncUserPlaylists: () => Promise<void>;
  migrateLocalPlaylistsToUser: (userId: string) => Promise<number>;
  getUserPlaylists: () => Playlist[];

  // Internal sync handler
  _handleSyncMessage: (msg: SyncMessage) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => {
      // Initialize BroadcastChannel when store is created
      const handleSyncMessage = (msg: SyncMessage) => {
        get()._handleSyncMessage(msg);
      };

      // Defer initialization to avoid SSR issues
      if (typeof window !== 'undefined') {
        setTimeout(() => initBroadcastChannel(handleSyncMessage), 0);
      }

      return {
        playlists: [],
        activePlaylistId: null,
        isCollaborativeMode: true, // Enabled by default

        createPlaylist: (name: string, description = '') => {
          const id = nanoid(10);
          const now = Date.now();

          // Get user from auth store - need to import dynamically to avoid circular dependency
          let userId: string | null = null;
          try {
            const authStore = (window as any).__authStore;
            userId = authStore?.getState?.()?.user?.id || null;
          } catch (e) {
            // Auth store not available, playlist will be anonymous
          }

          const newPlaylist: Playlist = {
            id,
            name,
            description,
            movieIds: [],
            createdAt: now,
            updatedAt: now,
            isPublic: false,
            userId,
          };

          set((state) => ({
            playlists: [...state.playlists, newPlaylist],
            activePlaylistId: id,
          }));

          // Auto-sync to cloud if user is authenticated
          if (userId && isSupabaseConfigured()) {
            savePlaylistToCloud(newPlaylist).then(() => {
              // Invalidate cache to refetch on next query
              queryClient.invalidateQueries({ queryKey: ['playlists', 'user', userId] });
            });
          }

          // Broadcast to other tabs
          if (get().isCollaborativeMode) {
            broadcast('PLAYLIST_CREATE', newPlaylist);
          }

          return id;
        },

        deletePlaylist: (id: string) => {
          const playlist = get().playlists.find((p) => p.id === id);
          const userId = playlist?.userId;

          set((state) => ({
            playlists: state.playlists.filter((p) => p.id !== id),
            activePlaylistId: state.activePlaylistId === id ? null : state.activePlaylistId,
          }));

          if (get().isCollaborativeMode) {
            broadcast('PLAYLIST_DELETE', { id });
          }

          // Also delete from cloud if configured
          if (isSupabaseConfigured()) {
            deletePlaylistFromCloud(id).then(() => {
              // Invalidate cache after deletion
              if (userId) {
                queryClient.invalidateQueries({ queryKey: ['playlists', 'user', userId] });
              }
            });
          }
        },

        updatePlaylist: (id: string, updates) => {
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === id
                ? { ...p, ...updates, updatedAt: Date.now() }
                : p
            ),
          }));

          if (get().isCollaborativeMode) {
            broadcast('PLAYLIST_UPDATE', { id, updates });
          }
        },

        addMovieToPlaylist: (playlistId: string, movieId: number) => {
          const playlist = get().playlists.find((p) => p.id === playlistId);
          if (playlist?.movieIds.includes(movieId)) return;

          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === playlistId && !p.movieIds.includes(movieId)
                ? { ...p, movieIds: addMovieId(p.movieIds, movieId), updatedAt: Date.now() }
                : p
            ),
          }));

          // Sync updated playlist to cloud
          const updated = get().playlists.find((p) => p.id === playlistId);
          if (updated?.userId && isSupabaseConfigured()) {
            const userId = updated.userId;
            savePlaylistToCloud(updated).then(() => {
              queryClient.invalidateQueries({ queryKey: ['playlists', 'user', userId] });
            });
          }

          if (get().isCollaborativeMode) {
            broadcast('MOVIE_ADD', { playlistId, movieId });
          }
        },

        removeMovieFromPlaylist: (playlistId: string, movieId: number) => {
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === playlistId
                ? { ...p, movieIds: removeMovieId(p.movieIds, movieId), updatedAt: Date.now() }
                : p
            ),
          }));

          // Sync updated playlist to cloud
          const updated = get().playlists.find((p) => p.id === playlistId);
          if (updated?.userId && isSupabaseConfigured()) {
            const userId = updated.userId;
            savePlaylistToCloud(updated).then(() => {
              queryClient.invalidateQueries({ queryKey: ['playlists', 'user', userId] });
            });
          }

          if (get().isCollaborativeMode) {
            broadcast('MOVIE_REMOVE', { playlistId, movieId });
          }
        },

        reorderMoviesInPlaylist: (playlistId: string, movieIds: number[]) => {
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === playlistId
                ? { ...p, movieIds, updatedAt: Date.now() }
                : p
          ),
          }));

          if (get().isCollaborativeMode) {
            broadcast('MOVIE_REORDER', { playlistId, movieIds });
          }
        },

        setActivePlaylist: (id: string | null) => {
          set({ activePlaylistId: id });
        },

        getPlaylistById: (id: string) => {
          return get().playlists.find((p) => p.id === id);
        },

        duplicatePlaylist: (id: string) => {
          const playlist = get().getPlaylistById(id);
          if (!playlist) return null;

          const newId = nanoid(10);
          const now = Date.now();
          const newPlaylist: Playlist = {
            ...playlist,
            id: newId,
            name: `${playlist.name} (Copy)`,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            playlists: [...state.playlists, newPlaylist],
          }));

          if (get().isCollaborativeMode) {
            broadcast('PLAYLIST_CREATE', newPlaylist);
          }

          return newId;
        },

        enableCollaborativeMode: () => {
          set({ isCollaborativeMode: true });
        },

        disableCollaborativeMode: () => {
          set({ isCollaborativeMode: false });
        },

        sharePlaylist: async (playlistId: string) => {
          const playlist = get().getPlaylistById(playlistId);
          if (!playlist) return null;

          // Mark as public and update timestamp
          const updatedPlaylist = { ...playlist, isPublic: true, updatedAt: Date.now() };

          // Update local state
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === playlistId ? updatedPlaylist : p
            ),
          }));

          // Sync to cloud if configured
          if (isSupabaseConfigured()) {
            const success = await savePlaylistToCloud(updatedPlaylist);
            if (success && updatedPlaylist.userId) {
              queryClient.invalidateQueries({ queryKey: ['playlists', 'user', updatedPlaylist.userId] });
              queryClient.invalidateQueries({ queryKey: ['playlists', 'shared', playlistId] });
            }
            if (!success) {
              console.error('Failed to sync playlist to cloud');
            }
          }

          // Return shareable URL
          return `${window.location.origin}${import.meta.env.BASE_URL}/playlist/${playlistId}`;
        },

        fetchSharedPlaylist: async (id: string) => {
          // First check local storage
          const localPlaylist = get().getPlaylistById(id);
          if (localPlaylist) return localPlaylist;

          // Then try cloud if configured, using React Query cache
          if (isSupabaseConfigured()) {
            return await queryClient.fetchQuery({
              queryKey: ['playlists', 'shared', id],
              queryFn: () => fetchPublicPlaylist(id),
              staleTime: 10 * 60 * 1000, // 10 minutes
            });
          }

          return null;
        },

        importSharedPlaylist: (playlist: Playlist) => {
          // Import a shared playlist to local storage with new ID
          const newId = nanoid(10);

          // Get user from auth store
          let userId: string | null = null;
          try {
            const authStore = (window as any).__authStore;
            userId = authStore?.getState?.()?.user?.id || null;
          } catch (e) {
            // Auth store not available
          }

          const importedPlaylist: Playlist = {
            ...playlist,
            id: newId,
            name: `${playlist.name} (Imported)`,
            isPublic: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            userId,
          };

          set((state) => ({
            playlists: [...state.playlists, importedPlaylist],
          }));

          // Auto-sync if user is authenticated
          if (userId && isSupabaseConfigured()) {
            savePlaylistToCloud(importedPlaylist).then(() => {
              queryClient.invalidateQueries({ queryKey: ['playlists', 'user', userId] });
            });
          }

          if (get().isCollaborativeMode) {
            broadcast('PLAYLIST_CREATE', importedPlaylist);
          }
        },

        syncUserPlaylists: async () => {
          // Get user from auth store
          let userId: string | null = null;
          try {
            const authStore = (window as any).__authStore;
            userId = authStore?.getState?.()?.user?.id || null;
          } catch (e) {
            return;
          }

          if (!userId || !isSupabaseConfigured()) return;

          // Use React Query to fetch playlists (will use cache if available)
          const cloudPlaylists = await queryClient.fetchQuery({
            queryKey: ['playlists', 'user', userId],
            queryFn: () => fetchUserPlaylists(userId),
            staleTime: 5 * 60 * 1000, // 5 minutes
          });

          set((state) => ({
            playlists: mergePlaylists(state.playlists, cloudPlaylists),
          }));
        },

        migrateLocalPlaylistsToUser: async (userId: string) => {
          const localPlaylists = get().playlists.filter((p) => !p.userId);

          if (localPlaylists.length === 0) return 0;

          let migratedCount = 0;

          for (const playlist of localPlaylists) {
            const updatedPlaylist = { ...playlist, userId };

            // Update local state
            set((state) => ({
              playlists: state.playlists.map((p) =>
                p.id === playlist.id ? updatedPlaylist : p
              ),
            }));

            // Sync to cloud
            if (isSupabaseConfigured()) {
              const success = await savePlaylistToCloud(updatedPlaylist);
              if (success) {
                migratedCount++;
                queryClient.invalidateQueries({ queryKey: ['playlists', 'user', userId] });
              }
            } else {
              migratedCount++;
            }
          }

          return migratedCount;
        },

        getUserPlaylists: () => {
          // Get user from auth store
          let userId: string | null = null;
          try {
            const authStore = (window as any).__authStore;
            userId = authStore?.getState?.()?.user?.id || null;
          } catch (e) {
            // Auth store not available
          }

          if (!userId) return get().playlists; // Anonymous: show all local playlists
          return get().playlists.filter((p) => p.userId === userId);
        },

        _handleSyncMessage: (msg: SyncMessage) => {
          const { type, payload } = msg;

          switch (type) {
            case 'PLAYLIST_CREATE': {
              const newPlaylist = payload as Playlist;
              set((state) => {
                if (state.playlists.some((p) => p.id === newPlaylist.id)) return state;
                return { playlists: [...state.playlists, newPlaylist] };
              });
              break;
            }
            case 'PLAYLIST_DELETE': {
              const { id } = payload as { id: string };
              set((state) => ({
                playlists: state.playlists.filter((p) => p.id !== id),
                activePlaylistId: state.activePlaylistId === id ? null : state.activePlaylistId,
              }));
              break;
            }
            case 'PLAYLIST_UPDATE': {
              const { id, updates } = payload as { id: string; updates: Partial<Playlist> };
              set((state) => ({
                playlists: state.playlists.map((p) =>
                  p.id === id ? { ...p, ...updates } : p
                ),
              }));
              break;
            }
            case 'MOVIE_ADD': {
              const { playlistId, movieId } = payload as { playlistId: string; movieId: number };
              set((state) => ({
                playlists: state.playlists.map((p) =>
                  p.id === playlistId && !p.movieIds.includes(movieId)
                    ? { ...p, movieIds: [...p.movieIds, movieId] }
                    : p
                ),
              }));
              break;
            }
            case 'MOVIE_REMOVE': {
              const { playlistId, movieId } = payload as { playlistId: string; movieId: number };
              set((state) => ({
                playlists: state.playlists.map((p) =>
                  p.id === playlistId
                    ? { ...p, movieIds: p.movieIds.filter((id) => id !== movieId) }
                    : p
                ),
              }));
              break;
            }
            case 'MOVIE_REORDER': {
              const { playlistId, movieIds } = payload as { playlistId: string; movieIds: number[] };
              set((state) => ({
                playlists: state.playlists.map((p) =>
                  p.id === playlistId ? { ...p, movieIds } : p
                ),
              }));
              break;
            }
          }
        },
      };
    },
    {
      name: 'netflix-playlists-storage',
      partialize: (state) => ({
        playlists: state.playlists,
        activePlaylistId: state.activePlaylistId,
      }),
    }
  )
);
