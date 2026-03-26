import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState } from '../types';
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signOut as authSignOut,
  getCurrentUser,
  onAuthStateChange,
} from '../services/auth';
import { isSupabaseConfigured } from '../services/supabase';

interface AuthStore extends AuthState {
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      user: null,
      session: null,
      loading: true,

      initialize: async () => {
        if (!isSupabaseConfigured()) {
          set({ user: null, session: null, loading: false });
          return;
        }

        try {
          const user = await getCurrentUser();
          set({ user, loading: false });

          // Listen for auth changes
          onAuthStateChange((user) => {
            set({ user });
          });
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          set({ user: null, loading: false });
        }
      },

      signUp: async (email: string, password: string, displayName?: string) => {
        set({ loading: true });
        try {
          const user = await authSignUp(email, password, displayName);
          set({ user, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const user = await authSignIn(email, password);
          set({ user, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          await authSignOut();
          set({ user: null, session: null });
        } catch (error) {
          console.error('Failed to sign out:', error);
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user, // Persist user for faster initial load
      }),
    }
  )
);
