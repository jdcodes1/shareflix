import { describe, it, expect } from 'vitest';
import type { Playlist } from '../src/types';
import { addMovieId, removeMovieId, mergePlaylists } from '../src/store/playlistHelpers';

function makePlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: 'p1',
    name: 'Test',
    description: '',
    movieIds: [],
    createdAt: 1,
    updatedAt: 1,
    isPublic: false,
    userId: null,
    ...overrides,
  };
}

describe('addMovieId', () => {
  it('appends a new movie id', () => {
    expect(addMovieId([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it('is a no-op that returns the same reference when the id already exists', () => {
    const ids = [1, 2, 3];
    expect(addMovieId(ids, 2)).toBe(ids);
  });

  it('does not mutate the input array', () => {
    const ids = [1, 2];
    addMovieId(ids, 3);
    expect(ids).toEqual([1, 2]);
  });
});

describe('removeMovieId', () => {
  it('removes the given id', () => {
    expect(removeMovieId([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it('returns an equivalent list when the id is absent', () => {
    expect(removeMovieId([1, 2], 9)).toEqual([1, 2]);
  });
});

describe('mergePlaylists', () => {
  it('keeps the local copy when it is strictly newer than cloud', () => {
    const local = [makePlaylist({ id: 'a', name: 'local', updatedAt: 200 })];
    const cloud = [makePlaylist({ id: 'a', name: 'cloud', updatedAt: 100 })];
    const merged = mergePlaylists(local, cloud);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('local');
  });

  it('keeps the cloud copy when cloud is newer or ties', () => {
    const local = [makePlaylist({ id: 'a', name: 'local', updatedAt: 100 })];
    const cloud = [makePlaylist({ id: 'a', name: 'cloud', updatedAt: 100 })];
    expect(mergePlaylists(local, cloud)[0].name).toBe('cloud');
  });

  it('appends local-only playlists that are not present in the cloud', () => {
    const local = [makePlaylist({ id: 'localOnly', name: 'offline' })];
    const cloud = [makePlaylist({ id: 'a', name: 'cloud' })];
    const merged = mergePlaylists(local, cloud);
    const ids = merged.map((p) => p.id).sort();
    expect(ids).toEqual(['a', 'localOnly']);
  });
});
