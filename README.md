# Netflix Playlists

A Netflix-inspired shareable movie playlist application built as a portfolio project, featuring real movie data from TMDB.

## Features

- **Browse Page** - Netflix-style hero section with featured movie, horizontal carousels organized by genre
- **Trailer Playback** - Hover over movies to play trailers inline, with full trailer in hero section
- **Movie Cards** - Hover effects with play/add/info buttons, ratings, year, and genre tags
- **Playlist Creation** - Form with name/description fields and inspiration suggestions
- **Playlist View** - Draggable movie reordering with smooth animations
- **Search** - Search movies via TMDB API, filter by genre with real-time results
- **Shareable Links** - Each playlist has a unique URL (`/playlist/[id]`) with cloud sync for sharing
- **Persistent Storage** - Playlists saved to LocalStorage via Zustand, with optional cloud sync via Supabase
- **TMDB Integration** - Real movie data including posters, trailers, ratings, and metadata

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with Netflix brand colors (`#E50914`, `#141414`)
- **Animations:** Framer Motion
- **Drag & Drop:** @dnd-kit
- **State Management:** Zustand with persistence
- **Icons:** Lucide React
- **Routing:** React Router DOM
- **Video Player:** React Player (YouTube trailers)
- **API:** TMDB (The Movie Database)
- **Cloud Storage:** Supabase (optional, for playlist sharing)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Required for live movie data
VITE_TMDB_API_KEY=your_tmdb_api_key

# Optional - for cloud playlist sharing
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Getting a TMDB API Key:**

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/)
2. Go to Settings → API → Create → Developer
3. Copy your API Key (v3 auth)

> **Note:** The app works without API keys using fallback mock data with 100 curated movies.

## Project Structure

```
src/
├── components/
│   ├── Header.tsx           # Navigation header
│   ├── MovieCard.tsx        # Movie poster with hover effects
│   ├── MovieCarousel.tsx    # Horizontal scrolling movie row
│   ├── MovieModal.tsx       # Movie detail modal
│   ├── PlaylistCard.tsx     # Playlist thumbnail card
│   ├── DraggablePlaylist.tsx # Drag-and-drop movie list
│   ├── GenreRow.tsx         # Genre-specific movie carousel
│   ├── TrendingCarousel.tsx # Top 10 movies with rank numbers
│   └── TrailerPlayer.tsx    # YouTube trailer embed component
├── pages/
│   ├── Browse.tsx           # Home page with movie carousels
│   ├── Search.tsx           # Movie search and filtering
│   ├── MyPlaylists.tsx      # User's playlist collection
│   ├── Create.tsx           # New playlist form
│   └── PlaylistView.tsx     # Single playlist view
├── hooks/
│   ├── useMovies.ts         # TMDB API hooks for movie data
│   └── useTrailer.ts        # Trailer fetching hooks
├── services/
│   ├── tmdb.ts              # TMDB API client
│   └── supabase.ts          # Supabase client for cloud sync
├── store/
│   └── playlistStore.ts     # Zustand store for playlists
├── data/
│   └── movies.ts            # Fallback movie database (100 titles with real TMDB IDs)
├── types/
│   └── index.ts             # TypeScript type definitions
└── App.tsx                  # Router configuration
```

## URL Routes

| Route           | Description                   |
| --------------- | ----------------------------- |
| `/`             | Browse movies by genre        |
| `/search`       | Search and filter movies      |
| `/my-playlists` | View all user playlists       |
| `/create`       | Create a new playlist         |
| `/playlist/:id` | View/edit a specific playlist |

## Deployment

This project is configured for deployment on Vercel:

```bash
npm run build
```

Then deploy the `dist` folder to Vercel or any static hosting provider.

## Playlist Sharing Setup (Supabase)

To enable playlist sharing across users, configure Supabase:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** from Settings → API

### 2. Create the Database Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Create playlists table
CREATE TABLE playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  movie_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  is_public BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read public playlists
CREATE POLICY "Public playlists readable" ON playlists
  FOR SELECT USING (is_public = true);

-- Allow anyone to insert (anonymous sharing)
CREATE POLICY "Anyone can insert" ON playlists
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update
CREATE POLICY "Anyone can update" ON playlists
  FOR UPDATE USING (true);
```

### 3. Configure Environment Variables

Add to your `.env` file:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx...
```

For Vercel deployment, add these same variables in your project settings.

### How Sharing Works

1. **Share**: When you click "Share" on a playlist, it's marked as public and synced to Supabase
2. **View**: Anyone with the link can view the playlist (fetched from Supabase)
3. **Import**: Visitors can save a copy to their own collection with "Save to My Playlists"

> **Note:** Without Supabase configured, the app works fully offline using LocalStorage. Shared links will only work on the same device/browser.

## API Integration

### TMDB Features

- **Trending Movies** - Daily/weekly trending from TMDB
- **Popular & Now Playing** - Current popular and theatrical releases
- **Genre Discovery** - Browse movies by genre (Action, Comedy, Horror, etc.)
- **Search** - Real-time movie search with debouncing
- **Movie Details** - Full metadata including cast, runtime, and ratings
- **Trailers** - YouTube trailer keys for inline playback

### Fallback Behavior

When no TMDB API key is configured, the app gracefully falls back to:

- 100 curated movies with real TMDB IDs (trailers still work)
- Static genre categories
- Full UI functionality with mock data

## Design Guidelines

Following Netflix brand aesthetics:

- **Primary Color:** `#E50914` (Netflix Red)
- **Background:** `#141414` (Dark)
- **Typography:** Helvetica Neue / system fonts
- **UI Patterns:** Dark mode, hover-to-reveal info, horizontal scroll carousels
- **Animations:** Smooth scale on hover (1.0 → 1.05), fade-in overlays
