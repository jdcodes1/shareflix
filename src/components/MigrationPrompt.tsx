import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Check } from 'lucide-react';

interface MigrationPromptProps {
  playlistCount: number;
  onMigrate: () => Promise<void>;
  onDismiss: () => void;
}

export function MigrationPrompt({ playlistCount, onMigrate, onDismiss }: MigrationPromptProps) {
  const [migrating, setMigrating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      await onMigrate();
      setSuccess(true);
      setTimeout(onDismiss, 2000);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg mx-4"
    >
      <div className="bg-[#1a1a1a] border border-[#E50914] rounded-lg p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E50914]/20 rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#E50914]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Save Your Playlists</h3>
              <p className="text-sm text-gray-400">
                {playlistCount} local {playlistCount === 1 ? 'playlist' : 'playlists'} found
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Would you like to sync your local playlists to your account? This will allow you to
          access them from any device.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleMigrate}
            disabled={migrating || success}
            className="flex-1 bg-[#E50914] hover:bg-[#f40612] disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-medium transition-colors flex items-center justify-center gap-2"
            style={{ padding: '12px 0' }}
          >
            {success ? (
              <>
                <Check className="w-5 h-5" />
                Migrated!
              </>
            ) : migrating ? (
              <>Migrating...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Sync to Account
              </>
            )}
          </button>
          <button
            onClick={onDismiss}
            className="bg-white/10 hover:bg-white/20 rounded font-medium transition-colors"
            style={{ padding: '12px 24px' }}
          >
            Skip
          </button>
        </div>
      </div>
    </motion.div>
  );
}
