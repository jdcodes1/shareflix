import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Movie } from '../types';
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getTrendingMovies,
  getMoviesByGenre as fetchMoviesByGenre,
  searchMovies as searchTMDB,
  getGenres,
  getMovieDetails,
  getPosterUrl,
  getBackdropUrl,
  isApiConfigured,
  getMovieLogo,
  type TMDBMovie,
  type TMDBMovieDetails,
} from '../services/tmdb';
import { movies as mockMovies, getMoviesByGenre as getMockByGenre, searchMovies as searchMock, getAllGenres as getMockGenres } from '../data/movies';

// Convert TMDB movie to our Movie type
function convertTMDBMovie(tmdb: TMDBMovie, genreNames: string[]): Movie {
  return {
    id: tmdb.id,
    title: tmdb.title,
    posterPath: getPosterUrl(tmdb.poster_path),
    backdropPath: getBackdropUrl(tmdb.backdrop_path),
    overview: tmdb.overview,
    releaseDate: tmdb.release_date,
    voteAverage: tmdb.vote_average,
    genres: genreNames,
  };
}

function convertTMDBDetails(tmdb: TMDBMovieDetails): Movie {
  return {
    id: tmdb.id,
    title: tmdb.title,
    posterPath: getPosterUrl(tmdb.poster_path),
    backdropPath: getBackdropUrl(tmdb.backdrop_path),
    overview: tmdb.overview,
    releaseDate: tmdb.release_date,
    voteAverage: tmdb.vote_average,
    genres: tmdb.genres.map(g => g.name),
  };
}

// Genre map for converting IDs to names
let genreMap: Map<number, string> = new Map();

async function ensureGenres(): Promise<void> {
  if (genreMap.size === 0 && isApiConfigured()) {
    const genres = await getGenres();
    genreMap = new Map(genres.map(g => [g.id, g.name]));
  }
}

function getGenreNames(ids: number[]): string[] {
  return ids.map(id => genreMap.get(id)).filter((name): name is string => !!name);
}

// Hook for popular movies
export function usePopularMovies() {
  const { data: movies = [], isLoading: loading, error } = useQuery({
    queryKey: ['movies', 'popular'],
    queryFn: async () => {
      if (!isApiConfigured()) {
        return mockMovies.slice(10, 30);
      }

      try {
        await ensureGenres();
        const data = await getPopularMovies();
        return data.results.map(m => convertTMDBMovie(m, getGenreNames(m.genre_ids)));
      } catch (err) {
        return mockMovies.slice(10, 30);
      }
    },
  });

  return { movies, loading, error: error ? (error as Error).message : null };
}

// Hook for top rated movies (Top 10)
export function useTopRatedMovies(limit = 10) {
  const { data: movies = [], isLoading: loading, error } = useQuery({
    queryKey: ['movies', 'topRated', limit],
    queryFn: async () => {
      if (!isApiConfigured()) {
        return [...mockMovies].sort((a, b) => b.voteAverage - a.voteAverage).slice(0, limit);
      }

      try {
        await ensureGenres();
        const data = await getTopRatedMovies();
        return data.results.slice(0, limit).map(m => convertTMDBMovie(m, getGenreNames(m.genre_ids)));
      } catch (err) {
        return [...mockMovies].sort((a, b) => b.voteAverage - a.voteAverage).slice(0, limit);
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  return { movies, loading, error: error ? (error as Error).message : null };
}

// Hook for now playing movies
export function useNowPlayingMovies() {
  const { data: movies = [], isLoading: loading, error } = useQuery({
    queryKey: ['movies', 'nowPlaying'],
    queryFn: async () => {
      if (!isApiConfigured()) {
        return [...mockMovies].sort((a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        ).slice(0, 20);
      }

      try {
        await ensureGenres();
        const data = await getNowPlayingMovies();
        return data.results.map(m => convertTMDBMovie(m, getGenreNames(m.genre_ids)));
      } catch (err) {
        return [...mockMovies].sort((a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        ).slice(0, 20);
      }
    },
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });

  return { movies, loading, error: error ? (error as Error).message : null };
}

// Hook for trending movies
export function useTrendingMovies() {
  const { data: movies = [], isLoading: loading, error } = useQuery({
    queryKey: ['movies', 'trending', 'week'],
    queryFn: async () => {
      if (!isApiConfigured()) {
        return [...mockMovies].sort((a, b) => b.voteAverage - a.voteAverage).slice(0, 10);
      }

      try {
        await ensureGenres();
        const data = await getTrendingMovies('week');
        return data.results.slice(0, 10).map(m => convertTMDBMovie(m, getGenreNames(m.genre_ids)));
      } catch (err) {
        return [...mockMovies].sort((a, b) => b.voteAverage - a.voteAverage).slice(0, 10);
      }
    },
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
  });

  return { movies, loading, error: error ? (error as Error).message : null };
}

// Hook for movies by genre
export function useMoviesByGenre(genreId: number | null, genreName: string) {
  const { data: movies = [], isLoading: loading, error } = useQuery({
    queryKey: ['movies', 'genre', genreId, genreName],
    queryFn: async () => {
      if (!genreId || !isApiConfigured()) {
        return getMockByGenre(genreName);
      }

      try {
        await ensureGenres();
        const data = await fetchMoviesByGenre(genreId);
        return data.results.map(m => convertTMDBMovie(m, getGenreNames(m.genre_ids)));
      } catch (err) {
        return getMockByGenre(genreName);
      }
    },
  });

  return { movies, loading, error: error ? (error as Error).message : null };
}

// Hook for searching movies
export function useSearchMovies(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: movies = [], isLoading: loading, error } = useQuery({
    queryKey: ['movies', 'search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) {
        return [];
      }

      if (!isApiConfigured()) {
        return searchMock(debouncedQuery);
      }

      try {
        await ensureGenres();
        const data = await searchTMDB(debouncedQuery);
        return data.results.map(m => convertTMDBMovie(m, getGenreNames(m.genre_ids)));
      } catch (err) {
        return searchMock(debouncedQuery);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: debouncedQuery.trim().length > 0,
  });

  return { movies, loading, error: error ? (error as Error).message : null };
}

// Hook for all genres
export function useGenres() {
  const { data: genres = [], isLoading: loading } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      if (!isApiConfigured()) {
        const mockGenreNames = getMockGenres();
        return mockGenreNames.map((name, idx) => ({ id: idx + 1, name }));
      }

      try {
        return await getGenres();
      } catch {
        const mockGenreNames = getMockGenres();
        return mockGenreNames.map((name, idx) => ({ id: idx + 1, name }));
      }
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { genres, loading };
}

// Hook for a featured movie (for hero section)
export function useFeaturedMovie() {
  const { data: movie = null, isLoading: loading } = useQuery({
    queryKey: ['movies', 'featured'],
    queryFn: async () => {
      if (!isApiConfigured()) {
        return mockMovies[0];
      }

      try {
        await ensureGenres();
        const data = await getTrendingMovies('day');
        if (data.results.length > 0) {
          const featured = data.results[0];
          return convertTMDBMovie(featured, getGenreNames(featured.genre_ids));
        }
        return mockMovies[0];
      } catch {
        return mockMovies[0];
      }
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });

  return { movie, loading };
}

// Hook for getting movies by IDs (for playlists)
export function useMoviesByIds(ids: number[]) {
  const { data: movies = [], isLoading: loading } = useQuery({
    queryKey: ['movies', 'byIds', ids.join(',')],
    queryFn: async () => {
      if (ids.length === 0) {
        return [];
      }

      if (!isApiConfigured()) {
        return ids
          .map(id => mockMovies.find(m => m.id === id))
          .filter((m): m is Movie => !!m);
      }

      try {
        const results = await Promise.all(
          ids.map(async id => {
            try {
              const details = await getMovieDetails(id);
              return convertTMDBDetails(details);
            } catch {
              return mockMovies.find(m => m.id === id) || null;
            }
          })
        );
        return results.filter((m): m is Movie => m !== null);
      } catch {
        return ids
          .map(id => mockMovies.find(m => m.id === id))
          .filter((m): m is Movie => !!m);
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: ids.length > 0,
  });

  return { movies, loading };
}

// Hook for fetching a movie's logo image
export function useMovieLogo(movieId: number) {
  const { data: logoUrl = null } = useQuery({
    queryKey: ['movieLogo', movieId],
    queryFn: () => getMovieLogo(movieId),
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - logos don't change
    enabled: isApiConfigured(),
  });

  return logoUrl;
}
