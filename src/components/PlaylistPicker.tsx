import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';

interface PlaylistPickerProps {
  movieId: number;
  /** Render as a compact icon button (for cards) vs inline (for modals) */
  variant?: 'icon' | 'inline';
}

export function PlaylistPicker({ movieId, variant = 'icon' }: PlaylistPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null);
  const [placeAbove, setPlaceAbove] = useState(false);

  const { playlists, addMovieToPlaylist, removeMovieFromPlaylist, createPlaylist } =
    usePlaylistStore();

  const userPlaylists = playlists;
  const inPlaylists = userPlaylists.filter((p) => p.movieIds.includes(movieId));
  const isInAny = inPlaylists.length > 0;

  const DROPDOWN_WIDTH = 224; // w-56 = 14rem = 224px
  const DROPDOWN_MAX_HEIGHT = 320; // estimated max height of dropdown
  const GAP = 8;

  const updateDropdownPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;
    const shouldPlaceAbove = spaceAbove >= DROPDOWN_MAX_HEIGHT || spaceAbove > spaceBelow;

    setPlaceAbove(shouldPlaceAbove);

    // Clamp horizontally so it doesn't overflow the viewport
    let left = rect.left;
    if (left + DROPDOWN_WIDTH > vw - GAP) {
      left = vw - DROPDOWN_WIDTH - GAP;
    }
    if (left < GAP) left = GAP;

    const style: React.CSSProperties = {
      zIndex: 99999,
      left,
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

    setDropdownStyle(style);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowCreate(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Update position when open
  useEffect(() => {
    if (isOpen) {
      updateDropdownPos();
      window.addEventListener('scroll', updateDropdownPos, true);
      window.addEventListener('resize', updateDropdownPos);
      return () => {
        window.removeEventListener('scroll', updateDropdownPos, true);
        window.removeEventListener('resize', updateDropdownPos);
      };
    }
  }, [isOpen, updateDropdownPos]);

  // Focus input when create mode opens
  useEffect(() => {
    if (showCreate) inputRef.current?.focus();
  }, [showCreate]);

  const handleToggle = (playlistId: string) => {
    const playlist = userPlaylists.find((p) => p.id === playlistId);
    if (playlist?.movieIds.includes(movieId)) {
      removeMovieFromPlaylist(playlistId, movieId);
    } else {
      addMovieToPlaylist(playlistId, movieId);
    }
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createPlaylist(newName.trim());
    addMovieToPlaylist(id, movieId);
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div ref={ref} className="relative" style={{ zIndex: 9999 }}>
      {/* Trigger button */}
      {variant === 'icon' ? (
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
            isInAny
              ? 'bg-white border-white'
              : 'border-netflix-gray-light hover:border-white'
          }`}
        >
          {isInAny ? (
            <Check className="w-5 h-5 text-black" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </motion.button>
      ) : (
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${
            isInAny
              ? 'bg-white border-white'
              : 'border-[#808080] hover:border-white bg-[#2a2a2a]/60'
          }`}
          title={isInAny ? 'In playlist' : 'Add to playlist'}
        >
          {isInAny ? (
            <Check className="w-4 h-4 text-black" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </motion.button>
      )}

      {/* Dropdown rendered via portal to escape overflow-hidden containers */}
      {createPortal(
        <AnimatePresence>
          {isOpen && dropdownStyle && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: placeAbove ? -4 : 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: placeAbove ? -4 : 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed w-56 bg-[#2d2d2d] rounded-md shadow-xl border border-white/10 flex flex-col overflow-hidden"
              style={dropdownStyle}
            >
              <div className="py-1 min-h-0 flex-1 overflow-y-auto">
                {userPlaylists.length === 0 && !showCreate && (
                  <div className="px-4 py-3 text-sm text-[#999]">No playlists yet</div>
                )}

                {userPlaylists.map((playlist) => {
                  const isIn = playlist.movieIds.includes(movieId);
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => handleToggle(playlist.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 transition-colors text-left"
                    >
                      <div
                        className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isIn ? 'bg-white border-white' : 'border-[#666]'
                        }`}
                      >
                        {isIn && <Check className="w-3 h-3 text-black" />}
                      </div>
                      <span className="text-white truncate">{playlist.name}</span>
                      <span className="text-[#666] text-xs ml-auto flex-shrink-0">
                        {playlist.movieIds.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Create new playlist */}
              <div className="border-t border-white/10 flex-shrink-0">
                {showCreate ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreate();
                    }}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <input
                      ref={inputRef}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Playlist name"
                      className="flex-1 bg-transparent text-white text-sm placeholder-[#666] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newName.trim()}
                      className="text-xs font-medium text-[#E50914] hover:text-white disabled:text-[#555] transition-colors"
                    >
                      Add
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#999]" />
                    <span className="text-[#999]">Create new playlist</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
