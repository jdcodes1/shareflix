import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X } from 'lucide-react';
import type { Movie } from '../types';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { useSearchMovies, usePopularMovies, useGenres, useMoviesByGenre } from '../hooks/useMovies';

export function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<{ id: number; name: string } | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use TMDB hooks
  const { genres } = useGenres();
  const { movies: searchResults, loading: searchLoading } = useSearchMovies(query);
  const { movies: popularMovies } = usePopularMovies();

  // Get genre movies from TMDB API
  const { movies: genreMovies, loading: genreLoading } = useMoviesByGenre(
    selectedGenre?.id ?? null,
    selectedGenre?.name ?? ''
  );

  // Read query from URL params on mount
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      setSelectedGenre(null);
    }
    inputRef.current?.focus();
  }, [searchParams]);

  // Determine which movies to display
  const showResults = query.trim() || selectedGenre;
  const displayMovies = selectedGenre
    ? genreMovies
    : query.trim()
    ? searchResults
    : popularMovies;

  return (
    <div className="min-h-screen bg-black pt-[68px]">
      {/* Netflix-style search header */}
      <div className="sticky top-[68px] z-30 bg-[#141414] border-b border-white/10">
        <div className="px-4 md:px-14 py-4">
          {/* Search Input - Netflix style */}
          <div className="max-w-3xl">
            <div
              className={`relative flex items-center bg-black border transition-colors ${
                isFocused ? 'border-white' : 'border-white/50'
              }`}
            >
              <SearchIcon className="absolute left-4 w-5 h-5 text-white/70" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedGenre(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Titles, people, genres"
                className="w-full bg-transparent pl-12 pr-12 py-2.5 text-white placeholder-white/50 focus:outline-none"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setQuery('')}
                    className="absolute right-4 p-0.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Genre Tabs - Netflix style horizontal scroll */}
        <div className="px-4 md:px-14 pb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => {
                  setSelectedGenre(selectedGenre?.id === genre.id ? null : genre);
                  setQuery('');
                }}
                className={`rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedGenre?.id === genre.id
                    ? 'bg-white text-black'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                }`}
                style={{ padding: '9px 20px' }}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 md:px-14 py-8">
        {/* Results header */}
        <div className="mb-6">
          {showResults ? (
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg md:text-xl font-medium text-white">
                {selectedGenre ? `${selectedGenre.name}` : `Results for "${query}"`}
              </h2>
              <span className="text-[#808080] text-sm">
                {(searchLoading || genreLoading) ? (
                  'Searching...'
                ) : (
                  `${displayMovies.length} ${displayMovies.length === 1 ? 'title' : 'titles'}`
                )}
              </span>
            </div>
          ) : (
            <h2 className="text-lg md:text-xl font-medium text-white">
              Popular on Netflix
            </h2>
          )}
        </div>

        {/* Loading state */}
        {((searchLoading && query.trim()) || (genreLoading && selectedGenre)) && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Movie Grid - Netflix style */}
        {!searchLoading && !genreLoading && displayMovies.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4"
          >
            {displayMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
              >
                <MovieCard
                  movie={movie}
                  size="small"
                  onInfoClick={() => setSelectedMovie(movie)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : !searchLoading && !genreLoading && showResults ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="text-[#808080] text-center">
              <p className="text-xl mb-2">No results found</p>
              <p className="text-sm">
                Try different keywords or browse by genre
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}
