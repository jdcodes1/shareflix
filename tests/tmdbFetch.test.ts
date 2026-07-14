import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The TMDB client reads the API key from import.meta.env at module load time,
// so we stub the env and reset the module registry before each test, then load
// the module dynamically to pick up the stubbed value.
async function loadTmdb() {
  return import('../src/services/tmdb');
}

describe('tmdb fetch client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_TMDB_API_KEY', 'test-key-123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('reports the API key as configured', async () => {
    const { isApiConfigured } = await loadTmdb();
    expect(isApiConfigured()).toBe(true);
  });

  it('searchMovies builds a URL with query, page, and api_key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ page: 2, results: [], total_pages: 1, total_results: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { searchMovies } = await loadTmdb();
    const res = await searchMovies('the matrix', 2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('https://api.themoviedb.org/3/search/movie?');
    expect(url).toContain('query=the+matrix');
    expect(url).toContain('page=2');
    expect(url).toContain('api_key=test-key-123');
    expect(res.page).toBe(2);
  });

  it('getMoviesByGenre includes the genre id and popularity sort', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    const { getMoviesByGenre } = await loadTmdb();
    await getMoviesByGenre(28);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/discover/movie?');
    expect(url).toContain('with_genres=28');
    expect(url).toContain('sort_by=popularity.desc');
    expect(url).toContain('page=1');
  });

  it('throws a descriptive error when the API responds non-ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getPopularMovies } = await loadTmdb();
    await expect(getPopularMovies()).rejects.toThrow('TMDB API error: 404 Not Found');
  });

  it('getMovieTrailer prefers the official YouTube trailer over other videos', async () => {
    const videos = [
      { id: '1', key: 'teaserKey', name: 'Teaser', site: 'YouTube', type: 'Teaser', official: true },
      { id: '2', key: 'unofficialKey', name: 'Fan Trailer', site: 'YouTube', type: 'Trailer', official: false },
      { id: '3', key: 'officialKey', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true },
    ];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: videos }) });
    vi.stubGlobal('fetch', fetchMock);

    const { getMovieTrailer } = await loadTmdb();
    await expect(getMovieTrailer(603)).resolves.toBe('officialKey');
  });

  it('getMovieTrailer returns null when the request fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const { getMovieTrailer } = await loadTmdb();
    await expect(getMovieTrailer(1)).resolves.toBeNull();
  });
});
