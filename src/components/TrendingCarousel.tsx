import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { Movie } from '../types';
import { PlaylistPicker } from './PlaylistPicker';

interface TrendingCarouselProps {
  title: string;
  movies: Movie[];
  onMovieClick?: (movie: Movie) => void;
}

// Top 10 badge
function Top10Badge() {
  return (
    <span className="text-sm font-bold bg-netflix-red px-2 py-0.5 rounded">
      TOP 10
    </span>
  );
}

// Styled number component for ranking
function RankNumber({ rank }: { rank: number }) {
  return (
    <div className="relative flex-shrink-0 w-12 md:w-16 flex items-center justify-center">
      <span
        className="text-[80px] md:text-[120px] font-black leading-none"
        style={{
          fontFamily: 'Arial Black, sans-serif',
          WebkitTextStroke: '3px #595959',
          WebkitTextFillColor: 'transparent',
          textShadow: '4px 4px 0 #000',
        }}
      >
        {rank}
      </span>
    </div>
  );
}

export function TrendingCarousel({
  title,
  movies,
  onMovieClick,
}: TrendingCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  if (movies.length === 0) return null;

  return (
    <div className="relative group py-4 overflow-visible">
      {/* Title with Top 10 badge */}
      <div className="flex items-center gap-2 mb-2 px-4 md:px-14">
        <Top10Badge />
        <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 z-10 w-14 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronLeft className="w-8 h-8" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right Arrow */}
        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 z-10 w-14 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronRight className="w-8 h-8" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto overflow-y-hidden scroll-container px-4 md:px-14 py-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              className="relative flex-shrink-0 flex items-end cursor-pointer"
              onClick={() => onMovieClick?.(movie)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Rank Number */}
              <RankNumber rank={index + 1} />

              {/* Movie Poster */}
              <div className="relative w-[100px] md:w-[130px] aspect-[2/3] rounded overflow-hidden bg-netflix-bg-card -ml-4">
                <img
                  src={movie.posterPath}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Hover Overlay - inside overflow-hidden for gradient */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons - outside overflow-hidden so dropdown isn't clipped */}
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-2 left-12 md:left-16 right-1 flex items-center gap-1"
                    style={{ zIndex: 9999 }}
                  >
                    <PlaylistPicker movieId={movie.id} variant="icon" />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovieClick?.(movie);
                      }}
                      className="w-8 h-8 rounded-full border-2 border-netflix-gray-light hover:border-white flex items-center justify-center bg-black/60"
                    >
                      <Info className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
