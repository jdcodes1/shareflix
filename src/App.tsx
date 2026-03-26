import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { Browse } from './pages/Browse';
import { Search } from './pages/Search';
import { MyPlaylists } from './pages/MyPlaylists';
import { Create } from './pages/Create';
import { PlaylistView } from './pages/PlaylistView';
import { MigrationPrompt } from './components/MigrationPrompt';
import { Analytics } from '@vercel/analytics/react';
import { useAuthStore } from './store/authStore';
import { usePlaylistStore } from './store/playlistStore';

// Expose auth store to window for playlist store access
if (typeof window !== 'undefined') {
  (window as any).__authStore = useAuthStore;
}

function App() {
  const { initialize, user, loading: authLoading } = useAuthStore();
  const { playlists, migrateLocalPlaylistsToUser, syncUserPlaylists } = usePlaylistStore();
  const [showMigration, setShowMigration] = useState(false);
  const [migrationDismissed, setMigrationDismissed] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Check for local playlists to migrate when user logs in
  useEffect(() => {
    if (!authLoading && user && !migrationDismissed) {
      const localPlaylists = playlists.filter((p) => !p.userId);
      if (localPlaylists.length > 0) {
        setShowMigration(true);
      } else {
        // No local playlists, just sync from cloud
        syncUserPlaylists();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, migrationDismissed]);

  const handleMigration = async () => {
    if (user) {
      const count = await migrateLocalPlaylistsToUser(user.id);
      console.log(`Migrated ${count} playlists`);
      await syncUserPlaylists();
    }
  };

  const handleDismissMigration = () => {
    setShowMigration(false);
    setMigrationDismissed(true);
    // Still sync cloud playlists even if migration dismissed
    if (user) {
      syncUserPlaylists();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-netflix-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#E50914] mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-netflix-bg text-white">
        <Header />

        {/* Migration prompt */}
        {showMigration && user && (
          <MigrationPrompt
            playlistCount={playlists.filter((p) => !p.userId).length}
            onMigrate={handleMigration}
            onDismiss={handleDismissMigration}
          />
        )}

        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/my-playlists" element={<MyPlaylists />} />
          <Route path="/create" element={<Create />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
        </Routes>
        <Analytics />
      </div>
    </BrowserRouter>
  );
}

export default App;
