import { motion } from 'framer-motion';
import { Play, MoreVertical, Share2, Copy, Trash2, Link } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Playlist } from '../types';
import { useMoviesByIds } from '../hooks/useMovies';

interface PlaylistCardProps {
  playlist: Playlist;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  isActive?: boolean;
}

export function PlaylistCard({
  playlist,
  onSelect,
  onDelete,
  onDuplicate,
  onShare,
  onCopyLink,
  isActive = false,
}: PlaylistCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const [placeAbove, setPlaceAbove] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Only fetch the first 4 movies for thumbnails
  const thumbnailIds = useMemo(() => playlist.movieIds.slice(0, 4), [playlist.movieIds]);
  const { movies } = useMoviesByIds(thumbnailIds);

  const MENU_WIDTH = 160; // w-40 = 10rem = 160px
  const MENU_MAX_HEIGHT = 200;
  const GAP = 8;

  const updateMenuPos = useCallback(() => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;
    const shouldPlaceAbove = spaceAbove >= MENU_MAX_HEIGHT || spaceAbove > spaceBelow;

    setPlaceAbove(shouldPlaceAbove);

    // Position from right edge of button
    let right = vw - rect.right;
    if (right + MENU_WIDTH > vw - GAP) {
      right = GAP;
    }

    const style: React.CSSProperties = {
      zIndex: 99999,
      right,
      ...(shouldPlaceAbove
        ? {
            bottom: vh - rect.top + GAP,
            maxHeight: spaceAbove - GAP * 2,
          }
        : {
            top: rect.bottom + GAP,
            maxHeight: spaceBelow - GAP * 2,
          }),
    };

    setMenuStyle(style);
  }, []);

  useEffect(() => {
    if (showMenu) {
      updateMenuPos();
      window.addEventListener('scroll', updateMenuPos, true);
      window.addEventListener('resize', updateMenuPos);
      return () => {
        window.removeEventListener('scroll', updateMenuPos, true);
        window.removeEventListener('resize', updateMenuPos);
      };
    }
  }, [showMenu, updateMenuPos]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative bg-netflix-bg-card rounded-lg cursor-pointer group ${
        isActive ? 'ring-2 ring-netflix-red' : ''
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail Grid */}
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="relative overflow-hidden">
                {movies[index] ? (
                  <img
                    src={movies[index].posterPath}
                    alt={movies[index].title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-netflix-bg-light" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-netflix-bg-light flex items-center justify-center">
            <span className="text-netflix-gray text-sm">No movies yet</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 rounded-full bg-white/30 backdrop-blur flex items-center justify-center"
          >
            <Play className="w-6 h-6 fill-white ml-1" />
          </motion.div>
        </div>

        {/* Movie Count Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs font-medium">
          {playlist.movieIds.length} {playlist.movieIds.length === 1 ? 'movie' : 'movies'}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{playlist.name}</h3>
            {playlist.description && (
              <p className="text-sm text-netflix-gray-light truncate mt-1">
                {playlist.description}
              </p>
            )}
          </div>

          {/* Menu Button */}
          <div className="relative">
            <motion.button
              ref={menuButtonRef}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </motion.button>

            {/* Dropdown Menu - rendered via portal */}
            {showMenu &&
              createPortal(
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  {menuStyle && (
                    <motion.div
                      ref={menuRef}
                      initial={{ opacity: 0, scale: 0.95, y: placeAbove ? -10 : -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: placeAbove ? -10 : -10 }}
                      className="fixed w-40 bg-netflix-bg-card border border-white/10 rounded-lg shadow-xl py-1"
                      style={menuStyle}
                    >
                      <MenuButton
                        icon={<Share2 className="w-4 h-4" />}
                        label="Share"
                        onClick={() => {
                          onShare();
                          setShowMenu(false);
                        }}
                      />
                      <MenuButton
                        icon={<Link className="w-4 h-4" />}
                        label="Copy Link"
                        onClick={() => {
                          onCopyLink();
                          setShowMenu(false);
                        }}
                      />
                      <MenuButton
                        icon={<Copy className="w-4 h-4" />}
                        label="Duplicate"
                        onClick={() => {
                          onDuplicate();
                          setShowMenu(false);
                        }}
                      />
                      <MenuButton
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Delete"
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                        danger
                      />
                    </motion.div>
                  )}
                </>,
                document.body
              )}
          </div>
        </div>

        <div className="text-xs text-netflix-gray mt-2">
          Updated {formatRelativeTime(playlist.updatedAt)}
        </div>
      </div>
    </motion.div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
        danger ? 'text-red-500' : ''
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
