const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image size configurations
export const ImageSizes = {
  poster: {
    small: `${IMAGE_BASE_URL}/w342`,
    medium: `${IMAGE_BASE_URL}/w500`,
    large: `${IMAGE_BASE_URL}/w780`,
  },
  backdrop: {
    small: `${IMAGE_BASE_URL}/w780`,
    medium: `${IMAGE_BASE_URL}/w1280`,
    large: `${IMAGE_BASE_URL}/original`,
  },
  logo: {
    small: `${IMAGE_BASE_URL}/w185`,
    medium: `${IMAGE_BASE_URL}/w300`,
    large: `${IMAGE_BASE_URL}/w500`,
  },
} as const;

// TMDB API response types
export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  popularity: number;
}

export interface TMDBMovieDetails extends Omit<TMDBMovie, 'genre_ids'> {
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Genre ID to name mapping (cached)
let genreMap: Map<number, string> | null = null;

// Check if API key is configured
export function isApiConfigured(): boolean {
  return !!API_KEY;
}

// Fetch wrapper with error handling
async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error('TMDB API key not configured. Add VITE_TMDB_API_KEY to your .env file.');
  }

  const searchParams = new URLSearchParams({
    api_key: API_KEY,
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Get genre list and cache it
export async function getGenres(): Promise<TMDBGenre[]> {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>('/genre/movie/list');

  // Cache the genre map
  genreMap = new Map(data.genres.map(g => [g.id, g.name]));

  return data.genres;
}

// Get genre name from ID
export function getGenreName(id: number): string {
  return genreMap?.get(id) || 'Unknown';
}

// Convert genre IDs to names
export async function getGenreNames(ids: number[]): Promise<string[]> {
  if (!genreMap) {
    await getGenres();
  }
  return ids.map(id => genreMap?.get(id) || 'Unknown').filter(name => name !== 'Unknown');
}

// Fetch popular movies
export async function getPopularMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB<TMDBResponse<TMDBMovie>>('/movie/popular', { page: String(page) });
}

// Fetch top rated movies
export async function getTopRatedMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB<TMDBResponse<TMDBMovie>>('/movie/top_rated', { page: String(page) });
}

// Fetch now playing movies
export async function getNowPlayingMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB<TMDBResponse<TMDBMovie>>('/movie/now_playing', { page: String(page) });
}

// Fetch upcoming movies
export async function getUpcomingMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB<TMDBResponse<TMDBMovie>>('/movie/upcoming', { page: String(page) });
}

// Fetch trending movies
export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB<TMDBResponse<TMDBMovie>>(`/trending/movie/${timeWindow}`);
}

// Fetch movies by genre
export async function getMoviesByGenre(genreId: number, page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB<TMDBResponse<TMDBMovie>>('/discover/movie', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  });
}

// Search movies
export async function searchMovies(query: string, page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB<TMDBResponse<TMDBMovie>>('/search/movie', {
    query,
    page: String(page),
  });
}

// Get movie details with credits
export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  return fetchTMDB<TMDBMovieDetails>(`/movie/${movieId}`, {
    append_to_response: 'credits',
  });
}

// Get movie videos (trailers, teasers, etc.)
export async function getMovieVideos(movieId: number): Promise<TMDBVideo[]> {
  const data = await fetchTMDB<{ results: TMDBVideo[] }>(`/movie/${movieId}/videos`);
  return data.results;
}

// Get the best trailer for a movie
export async function getMovieTrailer(movieId: number): Promise<string | null> {
  try {
    const videos = await getMovieVideos(movieId);

    // Priority: Official Trailer > Trailer > Teaser
    const trailer =
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
      videos.find(v => v.site === 'YouTube' && v.type === 'Teaser');

    return trailer?.key || null;
  } catch {
    return null;
  }
}

// Get movie recommendations
export async function getMovieRecommendations(movieId: number): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB<TMDBResponse<TMDBMovie>>(`/movie/${movieId}/recommendations`);
}

// Get multiple movies by IDs
export async function getMoviesByIds(ids: number[]): Promise<TMDBMovieDetails[]> {
  const promises = ids.map(id => getMovieDetails(id).catch(() => null));
  const results = await Promise.all(promises);
  return results.filter((movie): movie is TMDBMovieDetails => movie !== null);
}

// Helper to build image URLs
export function getPosterUrl(path: string | null, size: keyof typeof ImageSizes.poster = 'medium'): string {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Poster';
  return `${ImageSizes.poster[size]}${path}`;
}

export function getBackdropUrl(path: string | null, size: keyof typeof ImageSizes.backdrop = 'large'): string {
  if (!path) return 'https://via.placeholder.com/1920x1080?text=No+Image';
  return `${ImageSizes.backdrop[size]}${path}`;
}

// Get movie logo (title treatment image)
export interface TMDBImage {
  file_path: string;
  width: number;
  height: number;
  iso_639_1: string | null;
}

export async function getMovieLogo(movieId: number): Promise<string | null> {
  try {
    const data = await fetchTMDB<{ logos: TMDBImage[] }>(`/movie/${movieId}/images`, {
      include_image_language: 'en,null',
    });

    // Pick the best English logo (prefer wider ones for landscape cards)
    const logo = data.logos
      .filter(l => l.iso_639_1 === 'en' || l.iso_639_1 === null)
      .sort((a, b) => b.width - a.width)[0];

    return logo ? `${ImageSizes.logo.medium}${logo.file_path}` : null;
  } catch {
    return null;
  }
}

// Trailer cache for performance
const trailerCache = new Map<number, string | null>();

export async function getCachedTrailer(movieId: number): Promise<string | null> {
  if (trailerCache.has(movieId)) {
    return trailerCache.get(movieId)!;
  }

  const trailer = await getMovieTrailer(movieId);
  trailerCache.set(movieId, trailer);
  return trailer;
}

// Clear trailer cache (useful for memory management)
export function clearTrailerCache(): void {
  trailerCache.clear();
}
