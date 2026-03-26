import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import type { Movie } from '../types';
import {
  getMovieDetails,
  getMovieRecommendations,
  getPosterUrl,
  getBackdropUrl,
  isApiConfigured,
  type TMDBMovieDetails,
  type TMDBMovie,
} from '../services/tmdb';
import { PlaylistPicker } from './PlaylistPicker';
import { MovieCard } from './MovieCard';

interface MovieModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function MovieModal({ movie, isOpen, onClose }: MovieModalProps) {
  const [details, setDetails] = useState<TMDBMovieDetails | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Movie | null>(null);

  // Fetch details + recommendations when movie changes
  useEffect(() => {
    if (!movie || !isOpen) {
      setDetails(null);
      setRecommendations([]);
      return;
    }

    if (!isApiConfigured()) return;

    setLoadingDetails(true);
    Promise.all([
      getMovieDetails(movie.id).catch(() => null),
      getMovieRecommendations(movie.id).catch(() => null),
    ]).then(([detailsData, recsData]) => {
      setDetails(detailsData);
      if (recsData) {
        setRecommendations(
          recsData.results.slice(0, 12).map((m: TMDBMovie) => ({
            id: m.id,
            title: m.title,
            posterPath: getPosterUrl(m.poster_path),
            backdropPath: getBackdropUrl(m.backdrop_path),
            overview: m.overview,
            releaseDate: m.release_date,
            voteAverage: m.vote_average,
            genres: [],
          }))
        );
      }
      setLoadingDetails(false);
    });
  }, [movie?.id, isOpen]);

  // Reset selectedRec when modal closes or prop movie changes
  useEffect(() => {
    setSelectedRec(null);
  }, [movie?.id, isOpen]);

  // Re-fetch when selectedRec changes
  useEffect(() => {
    if (!selectedRec || !isOpen) return;
    if (!isApiConfigured()) return;

    setLoadingDetails(true);
    Promise.all([
      getMovieDetails(selectedRec.id).catch(() => null),
      getMovieRecommendations(selectedRec.id).catch(() => null),
    ]).then(([detailsData, recsData]) => {
      setDetails(detailsData);
      if (recsData) {
        setRecommendations(
          recsData.results.slice(0, 12).map((m: TMDBMovie) => ({
            id: m.id,
            title: m.title,
            posterPath: getPosterUrl(m.poster_path),
            backdropPath: getBackdropUrl(m.backdrop_path),
            overview: m.overview,
            releaseDate: m.release_date,
            voteAverage: m.vote_average,
            genres: [],
          }))
        );
      }
      setLoadingDetails(false);
    });
  }, [selectedRec?.id]);

  if (!movie) return null;

  const director = details?.credits?.crew.find((c) => c.job === 'Director');
  const writers = details?.credits?.crew
    .filter((c) => c.job === 'Screenplay' || c.job === 'Writer')
    .slice(0, 3);
  const cast = details?.credits?.cast.slice(0, 6);
  const allCast = details?.credits?.cast.slice(0, 15);

  const handleRecClick = (rec: Movie) => {
    setSelectedRec(rec);
  };

  const displayMovie = selectedRec || movie;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50"
          />

          {/* Modal Container - Scrollable */}
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="min-h-full flex items-start justify-center pt-8 pb-16 px-4">
              {/* Modal */}
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="relative w-full max-w-[850px] bg-[#181818] rounded-lg overflow-hidden shadow-2xl"
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#181818] flex items-center justify-center hover:bg-[#282828] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Hero Section */}
                <div className="relative aspect-video">
                  <img
                    src={displayMovie.backdropPath}
                    alt={displayMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#181818]/60 via-transparent to-transparent" />

                  {/* Title & Actions */}
                  <div className="absolute bottom-6 left-8 md:left-12 right-8 md:right-12">
                    {details?.tagline && (
                      <p className="text-[#bcbcbc] text-sm mb-1 italic">{details.tagline}</p>
                    )}
                    <h1 className="text-2xl md:text-4xl font-bold mb-4 drop-shadow-lg">
                      {displayMovie.title}
                    </h1>

                    <div className="flex items-center gap-2">
                      <PlaylistPicker movieId={displayMovie.id} variant="inline" />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div style={{ padding: '28px 48px 36px' }}>
                  <div
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
                    style={{ gap: '40px' }}
                  >
                    {/* Left Column */}
                    <div>
                      {/* Meta Row */}
                      <div
                        className="flex items-center flex-wrap text-sm"
                        style={{ gap: '10px', marginBottom: '12px' }}
                      >
                        <span className="text-[#46d369] font-semibold">
                          {Math.round(displayMovie.voteAverage * 10)}% Match
                        </span>
                        <span className="text-[#bcbcbc]">
                          {new Date(displayMovie.releaseDate).getFullYear()}
                        </span>
                        {details?.runtime ? (
                          <span className="text-[#bcbcbc]">{formatRuntime(details.runtime)}</span>
                        ) : null}
                        <span className="px-1 py-px border border-netflix-gray text-[#bcbcbc] text-[11px] leading-tight">
                          HD
                        </span>
                      </div>

                      {/* Rating */}
                      <div
                        className="flex items-center text-sm"
                        style={{ gap: '6px', marginBottom: '20px' }}
                      >
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-[#bcbcbc]">
                          {displayMovie.voteAverage.toFixed(1)} / 10
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-white" style={{ fontSize: '14px', lineHeight: 1.7 }}>
                        {displayMovie.overview}
                      </p>
                    </div>

                    {/* Right Column - Cast & Tags */}
                    <div
                      style={{
                        fontSize: '13px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      {/* Cast */}
                      <div>
                        <span className="text-[#777]">Cast: </span>
                        <span className="text-white">
                          {loadingDetails
                            ? '...'
                            : cast && cast.length > 0
                              ? cast.map((c) => c.name).join(', ')
                              : 'N/A'}
                        </span>
                      </div>

                      {/* Genres */}
                      <div>
                        <span className="text-[#777]">Genres: </span>
                        <span className="text-white">
                          {details
                            ? details.genres.map((g) => g.name).join(', ')
                            : displayMovie.genres.join(', ')}
                        </span>
                      </div>

                      {/* Director */}
                      {director && (
                        <div>
                          <span className="text-[#777]">Director: </span>
                          <span className="text-white">{director.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* More Like This Section */}
                {recommendations.length > 0 && (
                  <div style={{ padding: '0 48px 32px', marginTop: '8px' }}>
                    <div
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        paddingTop: '32px',
                      }}
                    >
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>
                        More Like This
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
                        {recommendations.map((rec) => (
                          <MovieCard
                            key={rec.id}
                            movie={rec}
                            size="small"
                            onInfoClick={() => handleRecClick(rec)}
                            showAddButton={true}
                            enableTrailer={false}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* About Section */}
                <div style={{ padding: '0 48px 48px' }}>
                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      paddingTop: '32px',
                    }}
                  >
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>
                      About {displayMovie.title}
                    </h2>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      fontSize: '14px',
                    }}
                  >
                    {director && (
                      <div>
                        <span className="text-[#777]">Director: </span>
                        <span className="text-white">{director.name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#777]">Cast: </span>
                      <span className="text-white">
                        {loadingDetails
                          ? '...'
                          : allCast && allCast.length > 0
                            ? allCast.map((c) => c.name).join(', ')
                            : 'N/A'}
                      </span>
                    </div>
                    {writers && writers.length > 0 && (
                      <div>
                        <span className="text-[#777]">Writer: </span>
                        <span className="text-white">
                          {writers.map((w) => w.name).join(', ')}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#777]">Genres: </span>
                      <span className="text-white">
                        {details
                          ? details.genres.map((g) => g.name).join(', ')
                          : displayMovie.genres.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
