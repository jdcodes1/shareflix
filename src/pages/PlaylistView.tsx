import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit2, Share2, Check, X, Plus, Download, Loader2, Copy } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useAuthStore } from '../store/authStore';
import { DraggablePlaylist } from '../components/DraggablePlaylist';
import { MovieModal } from '../components/MovieModal';
import { MovieCarousel } from '../components/MovieCarousel';
import type { Movie, Playlist } from '../types';
import { usePopularMovies } from '../hooks/useMovies';

export function PlaylistView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    playlists,
    setActivePlaylist,
    updatePlaylist,
    sharePlaylist,
    fetchSharedPlaylist,
    importSharedPlaylist,
  } = usePlaylistStore();

  // Fetch popular movies for suggestions
  const { movies: popularMovies } = usePopularMovies();

  // Check if playlist exists locally
  const localPlaylist = playlists.find((p) => p.id === id);

  const [playlist, setPlaylist] = useState<Playlist | null>(localPlaylist || null);
  const [loading, setLoading] = useState(!localPlaylist);

  // Determine ownership and edit permissions
  const isOwner = user && playlist?.userId === user.id;
  const canEdit = isOwner || !playlist?.userId; // Can edit if owner OR anonymous
  const isSharedView = !canEdit;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [importToast, setImportToast] = useState(false);
  const [, setShowShareMenu] = useState(false);

  // Fetch playlist from cloud if not found locally
  useEffect(() => {
    async function loadPlaylist() {
      if (!id) {
        setLoading(false);
        return;
      }

      // Check local first
      const local = playlists.find((p) => p.id === id);
      if (local) {
        setPlaylist(local);
        setLoading(false);
        return;
      }

      // Try fetching from cloud
      const sharedPlaylist = await fetchSharedPlaylist(id);
      if (sharedPlaylist) {
        setPlaylist(sharedPlaylist);
      }
      setLoading(false);
    }

    loadPlaylist();
  }, [id, playlists, fetchSharedPlaylist]);

  // Keep playlist in sync with local changes (for owned playlists)
  useEffect(() => {
    if (canEdit && localPlaylist) {
      setPlaylist(localPlaylist);
    }
  }, [localPlaylist, canEdit]);

  useEffect(() => {
    if (id && canEdit) {
      setActivePlaylist(id);
    }
  }, [id, setActivePlaylist, canEdit]);

  useEffect(() => {
    if (playlist) {
      setEditName(playlist.name);
      setEditDescription(playlist.description);
    }
  }, [playlist]);

  // Handle importing shared playlist
  const handleImport = () => {
    if (playlist) {
      importSharedPlaylist(playlist);
      setImportToast(true);
      setTimeout(() => {
        setImportToast(false);
        navigate('/my-playlists');
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-bg pt-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-netflix-red mx-auto mb-4" />
          <p className="text-netflix-gray-light">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-netflix-bg pt-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-semibold mb-2">Playlist not found</h2>
          <p className="text-netflix-gray-light mb-6">
            This playlist may have been deleted or doesn't exist.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/my-playlists')}
            className="bg-netflix-red hover:bg-netflix-red-hover rounded font-medium"
            style={{ padding: '10px 24px' }}
          >
            Go to My Playlists
          </motion.button>
        </div>
      </div>
    );
  }

  const suggestedMovies = popularMovies
    .filter((m) => !playlist.movieIds.includes(m.id))
    .slice(0, 20);

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updatePlaylist(playlist.id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setIsEditing(false);
    }
  };

  const handleCopyLink = async () => {
    const url = await sharePlaylist(playlist.id);
    if (url) {
      navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
      setShowShareMenu(false);
    }
  };

  const handleNativeShare = async () => {
    const url = await sharePlaylist(playlist.id);
    if (url && navigator.share) {
      navigator.share({
        title: playlist.name,
        text: playlist.description || 'Check out my movie playlist!',
        url,
      });
      setShowShareMenu(false);
    }
  };


  return (
    <div className="min-h-screen bg-netflix-bg pt-24 pb-16">
      {/* Header */}
      <div className="px-4 md:px-14 mb-8">
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate('/my-playlists')}
          className="flex items-center gap-2 text-netflix-gray-light hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          My Playlists
        </motion.button>

        {/* Playlist Info */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-netflix-bg-card border border-netflix-gray/30 rounded-lg px-4 py-2 text-2xl font-bold focus:outline-none focus:border-white"
                  placeholder="Playlist name"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-netflix-bg-card border border-netflix-gray/30 rounded-lg px-4 py-2 text-netflix-gray-light focus:outline-none focus:border-white resize-none"
                  placeholder="Description (optional)"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
                    style={{ padding: '10px 20px' }}
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(playlist.name);
                      setEditDescription(playlist.description);
                    }}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-medium"
                    style={{ padding: '10px 20px' }}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-netflix-gray-light text-lg mb-2">
                    {playlist.description}
                  </p>
                )}
                <p className="text-sm text-netflix-gray">
                  {playlist.movieIds.length}{' '}
                  {playlist.movieIds.length === 1 ? 'movie' : 'movies'}
                </p>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-3">
              {isSharedView ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleImport}
                  className="flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-hover rounded font-medium transition-colors"
                  style={{ padding: '10px 22px' }}
                >
                  <Download className="w-4 h-4" />
                  Save to My Playlists
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded font-medium transition-colors"
                    style={{ padding: '10px 22px' }}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNativeShare}
                    className="flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-hover rounded font-medium transition-colors"
                    style={{ padding: '10px 22px' }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded font-medium transition-colors"
                    style={{ padding: '10px 22px' }}
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </motion.button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Share Toast */}
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 rounded-lg shadow-lg z-50"
          >
            Link copied to clipboard!
          </motion.div>
        )}

        {/* Import Toast */}
        {importToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 rounded-lg shadow-lg z-50"
          >
            Playlist saved to your collection!
          </motion.div>
        )}
      </div>

      {/* Playlist Content - Draggable for owned, read-only for shared */}
      <div className="px-4 md:px-14 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {isSharedView ? 'Movies in this Playlist' : 'Your Movies'}
          </h2>
          {!isSharedView && (
            <span className="text-sm text-netflix-gray-light">Drag to reorder</span>
          )}
        </div>
        <DraggablePlaylist
          playlistId={playlist.id}
          movieIds={playlist.movieIds}
          onMovieClick={setSelectedMovie}
          disabled={isSharedView}
        />
      </div>

      {/* Add More Movies - Only for owned playlists */}
      {!isSharedView && (
        <div className="border-t border-white/10 pt-8">
          <div className="px-4 md:px-14 mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-netflix-red" />
              <h2 className="text-xl font-semibold">Add More Movies</h2>
            </div>
          </div>
          <MovieCarousel
            title="Suggested for You"
            movies={suggestedMovies}
            onMovieClick={setSelectedMovie}
          />
        </div>
      )}

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}
