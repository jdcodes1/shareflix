export interface Movie {
  id: number;
  title: string;
  posterPath: string;
  backdropPath: string;
  overview: string;
  releaseDate: string;
  voteAverage: number;
  genres: string[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  movieIds: number[];
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  userId?: string | null; // null = anonymous, undefined = not yet set (localStorage)
}

export interface PlaylistWithMovies extends Omit<Playlist, 'movieIds'> {
  movies: Movie[];
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}
