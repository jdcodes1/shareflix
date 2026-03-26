import { useState } from "react";
import { motion } from "framer-motion";
import { Info, VolumeX, Volume2 } from "lucide-react";
import type { Movie } from "../types";
import { MovieCarousel } from "../components/MovieCarousel";
import { TrendingCarousel } from "../components/TrendingCarousel";
import { MovieModal } from "../components/MovieModal";
import { GenreRow } from "../components/GenreRow";
import { TrailerPlayer } from "../components/TrailerPlayer";
import { PlaylistPicker } from "../components/PlaylistPicker";
import { usePlaylistStore } from "../store/playlistStore";
import {
  useFeaturedMovie,
  useTrendingMovies,
  useNowPlayingMovies,
  useGenres,
  useMoviesByIds,
} from "../hooks/useMovies";
import { useHeroTrailer } from "../hooks/useTrailer";

export function Browse() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isHeroPlaying] = useState(true);
  const [isHeroMuted, setIsHeroMuted] = useState(true);
  const { activePlaylistId, playlists } = usePlaylistStore();

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);

  // Fetch data from TMDB (falls back to mock data if no API key)
  const { movie: featuredMovie, loading: featuredLoading } = useFeaturedMovie();
  const { movies: trendingMovies } = useTrendingMovies();
  const { movies: nowPlayingMovies } = useNowPlayingMovies();
  const { genres } = useGenres();

  // Get playlist movies
  const { movies: playlistMovies } = useMoviesByIds(
    activePlaylist?.movieIds || [],
  );

  // Hero trailer
  const { trailerKey: heroTrailerKey } = useHeroTrailer(
    featuredMovie?.id || null,
  );

  if (featuredLoading || !featuredMovie) {
    return (
      <div className="min-h-screen bg-netflix-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-bg">
      {/* Hero Billboard - Netflix style */}
      <div className="relative h-[56.25vw] max-h-[80vh] min-h-[400px] overflow-hidden isolate">
        {/* Background Image / Trailer with vignette */}
        <div className="absolute inset-0">
          {heroTrailerKey && isHeroPlaying ? (
            <TrailerPlayer
              videoKey={heroTrailerKey}
              isPlaying={isHeroPlaying}
              isMuted={isHeroMuted}
              posterUrl={featuredMovie.backdropPath}
              className="w-full h-full"
            />
          ) : (
            <img
              src={featuredMovie.backdropPath}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-center"
            />
          )}
          {/* Netflix gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-netflix-bg via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-bg via-netflix-bg/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-netflix-bg/60 via-transparent to-transparent h-[20%]" />
        </div>

        {/* Billboard Content */}
        <div className="absolute bottom-[35%] left-4 md:left-14 max-w-lg z-20">
          {/* Title treatment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
              {featuredMovie.title}
            </h1>
          </motion.div>

          {/* Synopsis */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm md:text-lg text-white/90 mb-6 line-clamp-3 drop-shadow-md max-w-md"
          >
            {featuredMovie.overview}
          </motion.p>

          {/* Action Buttons - Netflix style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3"
          >
            <PlaylistPicker movieId={featuredMovie.id} variant="icon" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMovie(featuredMovie)}
              className="flex items-center gap-2 bg-[rgba(109,109,110,0.7)] text-white rounded font-semibold text-sm md:text-base lg:text-lg hover:bg-[rgba(109,109,110,0.4)] transition-colors"
              style={{ padding: '8px 20px' }}
            >
              <Info className="w-4 h-4 md:w-6 md:h-6" />
              More Info
            </motion.button>
          </motion.div>
        </div>

        {/* Maturity rating + Mute button - right side */}
        <div className="absolute bottom-[35%] right-4 md:right-14 flex items-center gap-3 z-20">
          {heroTrailerKey && isHeroPlaying && (
            <button
              onClick={() => setIsHeroMuted(!isHeroMuted)}
              className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              {isHeroMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content Rows */}
      <div className="relative z-10 pb-16 space-y-6 -mt-24 md:-mt-32">
        {/* Trending Now with Netflix-style numbers */}
        <TrendingCarousel
          title="Top 10 Movies Today"
          movies={trendingMovies}
          onMovieClick={setSelectedMovie}
        />

        {/* Continue Watching (if has active playlist) */}
        {activePlaylist && playlistMovies.length > 0 && (
          <MovieCarousel
            title="Your Playlist"
            movies={playlistMovies}
            onMovieClick={setSelectedMovie}
          />
        )}

        {/* New Releases */}
        <MovieCarousel
          title="New Releases"
          movies={nowPlayingMovies}
          onMovieClick={setSelectedMovie}
        />

        {/* Genre Rows - fetching from TMDB API */}
        {genres.slice(0, 3).map((genre) => (
          <GenreRow
            key={genre.id}
            genreId={genre.id}
            genreName={genre.name}
            onMovieClick={setSelectedMovie}
          />
        ))}
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
