import { supabase } from './supabase';
import type { User } from '../types';

// Convert Supabase auth user to our User type
function mapAuthUser(authUser: any): User {
  return {
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0],
    avatarUrl: authUser.user_metadata?.avatar_url,
  };
}

// Sign up with email/password
export async function signUp(email: string, password: string, displayName?: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  });

  if (error) throw error;
  return data.user ? mapAuthUser(data.user) : null;
}

// Sign in with email/password
export async function signIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user ? mapAuthUser(data.user) : null;
}

// Sign out
export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current session
export async function getCurrentSession() {
  if (!supabase) return null;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;

  return session;
}

// Get current user
export async function getCurrentUser() {
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;

  return user ? mapAuthUser(user) : null;
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!supabase) return () => {};

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? mapAuthUser(session.user) : null);
  });

  return () => subscription.unsubscribe();
}

// Password reset
export async function resetPassword(email: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

// Update password
export async function updatePassword(newPassword: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}
