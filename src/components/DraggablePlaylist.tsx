import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, X, Star } from 'lucide-react';
import type { Movie } from '../types';
import { useMoviesByIds } from '../hooks/useMovies';
import { usePlaylistStore } from '../store/playlistStore';

interface DraggablePlaylistProps {
  playlistId: string;
  movieIds: number[];
  onMovieClick?: (movie: Movie) => void;
  disabled?: boolean;
}

export function DraggablePlaylist({
  playlistId,
  movieIds,
  onMovieClick,
  disabled = false,
}: DraggablePlaylistProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const { reorderMoviesInPlaylist, removeMovieFromPlaylist } = usePlaylistStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { movies, loading } = useMoviesByIds(movieIds);
  const activeMovie = activeId ? movies.find((m) => m.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = movieIds.indexOf(active.id as number);
      const newIndex = movieIds.indexOf(over.id as number);
      const newOrder = arrayMove(movieIds, oldIndex, newIndex);
      reorderMoviesInPlaylist(playlistId, newOrder);
    }
  };

  const handleRemove = (movieId: number) => {
    removeMovieFromPlaylist(playlistId, movieId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-xl font-semibold mb-2">No movies yet</h3>
        <p className="text-netflix-gray-light max-w-md">
          {disabled
            ? 'This playlist is empty.'
            : 'Browse movies above and click the + button to add them to your playlist.'}
        </p>
      </div>
    );
  }

  // Read-only mode for shared playlists
  if (disabled) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4 scroll-container">
        {movies.map((movie) => (
          <ReadOnlyMovieCard
            key={movie.id}
            movie={movie}
            onClick={() => onMovieClick?.(movie)}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={movieIds} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-3 overflow-x-auto pb-4 scroll-container">
          {movies.map((movie) => (
            <SortableMovieCard
              key={movie.id}
              movie={movie}
              onRemove={() => handleRemove(movie.id)}
              onClick={() => onMovieClick?.(movie)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeMovie && <MovieCardOverlay movie={activeMovie} />}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableMovieCardProps {
  movie: Movie;
  onRemove: () => void;
  onClick: () => void;
}

function SortableMovieCard({ movie, onRemove, onClick }: SortableMovieCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movie.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`relative flex-shrink-0 w-[220px] md:w-[260px] group ${
        isDragging ? 'opacity-50' : ''
      }`}
      whileHover={{ scale: isDragging ? 1 : 1.05 }}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1.5 bg-black/70 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-10 p-1.5 bg-black/70 hover:bg-netflix-red rounded opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Card */}
      <div
        onClick={onClick}
        className="aspect-video rounded-md overflow-hidden bg-netflix-bg-card cursor-pointer"
      >
        <img
          src={movie.backdropPath}
          alt={movie.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Title */}
      <div className="mt-2 px-1">
        <h4 className="text-sm font-medium truncate">{movie.title}</h4>
        <div className="flex items-center gap-1 text-xs text-netflix-gray-light">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          {movie.voteAverage.toFixed(1)}
        </div>
      </div>
    </motion.div>
  );
}

function MovieCardOverlay({ movie }: { movie: Movie }) {
  return (
    <div className="w-[220px] md:w-[260px] opacity-90 rotate-3 scale-105">
      <div className="aspect-video rounded-md overflow-hidden shadow-2xl ring-2 ring-netflix-red">
        <img
          src={movie.backdropPath}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

// Read-only card for shared playlists
function ReadOnlyMovieCard({
  movie,
  onClick,
}: {
  movie: Movie;
  onClick: () => void;
}) {
  return (
    <motion.div
      className="relative flex-shrink-0 w-[220px] md:w-[260px]"
      whileHover={{ scale: 1.05 }}
    >
      <div
        onClick={onClick}
        className="aspect-video rounded-md overflow-hidden bg-netflix-bg-card cursor-pointer"
      >
        <img
          src={movie.backdropPath}
          alt={movie.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div className="mt-2 px-1">
        <h4 className="text-sm font-medium truncate">{movie.title}</h4>
        <div className="flex items-center gap-1 text-xs text-netflix-gray-light">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          {movie.voteAverage.toFixed(1)}
        </div>
      </div>
    </motion.div>
  );
}
