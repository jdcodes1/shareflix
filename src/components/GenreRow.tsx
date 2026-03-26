import { useMoviesByGenre } from '../hooks/useMovies';
import { MovieCarousel } from './MovieCarousel';
import type { Movie } from '../types';

interface GenreRowProps {
  genreId: number;
  genreName: string;
  onMovieClick: (movie: Movie) => void;
}

export function GenreRow({
  genreId,
  genreName,
  onMovieClick,
}: GenreRowProps) {
  const { movies, loading } = useMoviesByGenre(genreId, genreName);

  // Don't render if loading or not enough movies
  if (loading || movies.length < 5) {
    return null;
  }

  return (
    <MovieCarousel
      title={genreName}
      movies={movies}
      onMovieClick={onMovieClick}
    />
  );
}
