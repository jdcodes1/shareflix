import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useAuthStore } from '../store/authStore';
import { PlaylistCard } from '../components/PlaylistCard';

export function MyPlaylists() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    getUserPlaylists,
    deletePlaylist,
    duplicatePlaylist,
    sharePlaylist,
  } = usePlaylistStore();
  const [shareModalOpen, setShareModalOpen] = useState<string | null>(null);

  const playlists = getUserPlaylists();

  const handleShare = async (playlistId: string) => {
    // Use the new sharePlaylist action that syncs to cloud
    const url = await sharePlaylist(playlistId);

    if (url) {
      if (navigator.share) {
        navigator.share({
          title: 'Check out my playlist!',
          url,
        });
      } else {
        navigator.clipboard.writeText(url);
        setShareModalOpen(playlistId);
        setTimeout(() => setShareModalOpen(null), 2000);
      }
    }
  };

  const handleCopyLink = async (playlistId: string) => {
    const url = await sharePlaylist(playlistId);
    if (url) {
      navigator.clipboard.writeText(url);
      setShareModalOpen(playlistId);
      setTimeout(() => setShareModalOpen(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-bg pt-24 px-4 md:px-14 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Playlists</h1>
            <p className="text-netflix-gray-light">
              {user
                ? `${playlists.length} synced ${playlists.length === 1 ? 'playlist' : 'playlists'}`
                : `${playlists.length} local ${playlists.length === 1 ? 'playlist' : 'playlists'}`
              }
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-hover rounded font-medium transition-colors"
            style={{ padding: '10px 22px' }}
          >
            <Plus className="w-5 h-5" />
            New Playlist
          </motion.button>
        </div>

        {/* Playlists Grid */}
        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist, index) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PlaylistCard
                  playlist={playlist}
                  onSelect={() => navigate(`/playlist/${playlist.id}`)}
                  onDelete={() => deletePlaylist(playlist.id)}
                  onDuplicate={() => duplicatePlaylist(playlist.id)}
                  onShare={() => handleShare(playlist.id)}
                  onCopyLink={() => handleCopyLink(playlist.id)}
                />

                {/* Share Copied Toast */}
                {shareModalOpen === playlist.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 px-3 py-2 bg-green-600 rounded text-sm text-center"
                  >
                    Link copied to clipboard!
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🎬</div>
            <h2 className="text-2xl font-semibold mb-3">No playlists yet</h2>
            <p className="text-netflix-gray-light mb-8 max-w-md mx-auto">
              Create your first playlist to start organizing your favorite movies and share them with friends.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-hover rounded-lg font-semibold text-lg transition-colors"
              style={{ padding: '14px 32px' }}
            >
              <Plus className="w-6 h-6" />
              Create Your First Playlist
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
