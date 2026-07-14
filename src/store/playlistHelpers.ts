import type { Playlist } from '../types';

// Add a movie id to a playlist's movieIds, avoiding duplicates.
// Returns the original array reference when the movie is already present.
export function addMovieId(movieIds: number[], movieId: number): number[] {
  if (movieIds.includes(movieId)) return movieIds;
  return [...movieIds, movieId];
}

// Remove a movie id from a playlist's movieIds.
export function removeMovieId(movieIds: number[], movieId: number): number[] {
  return movieIds.filter((id) => id !== movieId);
}

// Merge local and cloud playlists.
// For playlists present in both, keep the one with the newer updatedAt
// (local wins ties only when strictly newer). Local-only playlists are
// appended so nothing is lost during sync.
export function mergePlaylists(local: Playlist[], cloud: Playlist[]): Playlist[] {
  const localMap = new Map(local.map((p) => [p.id, p]));
  const cloudMap = new Map(cloud.map((p) => [p.id, p]));
  const merged: Playlist[] = [];

  cloud.forEach((cloudPlaylist) => {
    const localPlaylist = localMap.get(cloudPlaylist.id);
    if (localPlaylist && localPlaylist.updatedAt > cloudPlaylist.updatedAt) {
      merged.push(localPlaylist);
    } else {
      merged.push(cloudPlaylist);
    }
  });

  local.forEach((localPlaylist) => {
    if (!cloudMap.has(localPlaylist.id)) {
      merged.push(localPlaylist);
    }
  });

  return merged;
}
