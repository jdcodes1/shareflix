import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, VolumeX, Volume2 } from 'lucide-react';
import type { Movie } from '../types';
import { useTrailer } from '../hooks/useTrailer';
import { useMovieLogo } from '../hooks/useMovies';
import { CardTrailerPlayer } from './TrailerPlayer';
import { PlaylistPicker } from './PlaylistPicker';

interface MovieCardProps {
  movie: Movie;
  onInfoClick?: () => void;
  showAddButton?: boolean;
  isInPlaylist?: boolean;
  onTogglePlaylist?: () => void;
  size?: 'small' | 'medium' | 'large';
  enableTrailer?: boolean;
}

export function MovieCard({
  movie,
  onInfoClick,
  showAddButton = true,
  size = 'medium',
  enableTrailer = true,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const logoUrl = useMovieLogo(movie.id);

  const {
    trailerKey,
    onHoverStart,
    onHoverEnd,
    shouldShowTrailer,
  } = useTrailer(movie.id, { enabled: enableTrailer, hoverDelay: 1000 });

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHoverStart();
  }, [onHoverStart]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHoverEnd();
  }, [onHoverEnd]);

  const sizeClasses = {
    small: 'w-[200px] md:w-[240px]',
    medium: 'w-[260px] md:w-[300px]',
    large: 'w-[320px] md:w-[380px]',
  };

  const aspectRatio = 'aspect-video';

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} flex-shrink-0 cursor-pointer`}
      onClick={onInfoClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Poster Image / Trailer */}
      <div className={`relative ${aspectRatio} rounded-md overflow-hidden bg-netflix-bg-card`}>
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-netflix-bg-card animate-pulse" />
        )}

        {/* Backdrop image */}
        <img
          src={movie.backdropPath}
          alt={movie.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${shouldShowTrailer && trailerKey ? 'opacity-0' : ''}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />

        {/* Trailer player - render when key available to allow preloading */}
        {trailerKey && (
          <CardTrailerPlayer
            videoKey={trailerKey}
            isPlaying={shouldShowTrailer}
            isMuted={isMuted}
            posterUrl={movie.backdropPath}
          />
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-6 z-10">
          {logoUrl ? (
            <>
              <img
                src={logoUrl}
                alt={movie.title}
                className={`max-h-10 max-w-[80%] object-contain object-left drop-shadow-lg transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLogoLoaded(true)}
                loading="lazy"
              />
              {!logoLoaded && (
                <p className="text-white text-sm font-semibold leading-tight line-clamp-1 drop-shadow-lg">
                  {movie.title}
                </p>
              )}
            </>
          ) : (
            <p className="text-white text-sm font-semibold leading-tight line-clamp-1 drop-shadow-lg">
              {movie.title}
            </p>
          )}
        </div>

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-20"
            >
              {/* Mute/Unmute button */}
              {shouldShowTrailer && trailerKey && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-30"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-white/70" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions - outside overflow-hidden so PlaylistPicker dropdown isn't clipped */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-30"
          >
            {showAddButton && (
              <PlaylistPicker movieId={movie.id} variant="icon" />
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick?.();
              }}
              className="w-10 h-10 rounded-full border-2 border-netflix-gray-light hover:border-white flex items-center justify-center ml-auto"
            >
              <Info className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
