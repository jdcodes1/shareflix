import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';

const PLAYLIST_SUGGESTIONS = [
  { name: 'Movie Night Picks', description: 'My favorites for a perfect movie night' },
  { name: 'Must Watch Classics', description: 'Timeless films everyone should see' },
  { name: 'Weekend Bingewatch', description: 'Perfect for a lazy weekend' },
  { name: 'Mind-Bending Thrillers', description: 'Films that will keep you guessing' },
  { name: 'Feel Good Movies', description: 'Guaranteed to lift your spirits' },
  { name: 'Date Night Collection', description: 'Romantic picks for two' },
];

export function Create() {
  const navigate = useNavigate();
  const { createPlaylist } = usePlaylistStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const playlistId = createPlaylist(name.trim(), description.trim());

    // Small delay for animation
    await new Promise((resolve) => setTimeout(resolve, 300));
    navigate(`/playlist/${playlistId}`);
  };

  const handleSuggestionClick = (suggestion: { name: string; description: string }) => {
    setName(suggestion.name);
    setDescription(suggestion.description);
  };

  return (
    <div className="min-h-screen bg-netflix-bg" style={{ paddingTop: '100px', paddingBottom: '64px', paddingLeft: '16px', paddingRight: '16px' }}>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-netflix-gray-light hover:text-white transition-colors"
          style={{ marginBottom: '40px' }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          style={{ marginBottom: '40px' }}
        >
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '12px' }}>Create New Playlist</h1>
          <p className="text-netflix-gray-light" style={{ fontSize: '16px' }}>
            Give your playlist a name and start adding movies
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium" style={{ marginBottom: '10px' }}>
              Playlist Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Movie Night Picks"
              className="w-full bg-netflix-bg-card border border-netflix-gray/30 rounded-lg focus:outline-none focus:border-white transition-colors"
              style={{ padding: '14px 18px' }}
              maxLength={50}
              required
            />
            <p className="text-xs text-netflix-gray text-right" style={{ marginTop: '6px' }}>
              {name.length}/50
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium" style={{ marginBottom: '10px' }}>
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this playlist about?"
              rows={3}
              className="w-full bg-netflix-bg-card border border-netflix-gray/30 rounded-lg focus:outline-none focus:border-white transition-colors resize-none"
              style={{ padding: '14px 18px' }}
              maxLength={200}
            />
            <p className="text-xs text-netflix-gray text-right" style={{ marginTop: '6px' }}>
              {description.length}/200
            </p>
          </div>

          <motion.button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-netflix-red hover:bg-netflix-red-hover disabled:bg-netflix-gray disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            style={{ padding: '16px 0', marginTop: '8px' }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Creating...
              </span>
            ) : (
              'Create Playlist'
            )}
          </motion.button>
        </motion.form>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginTop: '56px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '40px' }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
            <Sparkles className="w-5 h-5 text-netflix-red" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Need inspiration?</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '12px' }}>
            {PLAYLIST_SUGGESTIONS.map((suggestion, index) => (
              <motion.button
                key={suggestion.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left bg-netflix-bg-card hover:bg-netflix-bg-light rounded-lg transition-colors group"
                style={{ padding: '18px 20px' }}
              >
                <p className="font-medium group-hover:text-netflix-red transition-colors" style={{ marginBottom: '4px' }}>
                  {suggestion.name}
                </p>
                <p className="text-sm text-netflix-gray-light">{suggestion.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
