import { useState, useEffect, useRef, useCallback } from 'react';
import { getCachedTrailer, isApiConfigured } from '../services/tmdb';

interface UseTrailerOptions {
  // Delay before fetching trailer (ms)
  hoverDelay?: number;
  // Whether to auto-fetch on hover
  enabled?: boolean;
}

interface UseTrailerResult {
  trailerKey: string | null;
  isLoading: boolean;
  error: string | null;
  // Call this when hover starts
  onHoverStart: () => void;
  // Call this when hover ends
  onHoverEnd: () => void;
  // Whether we should show the trailer
  shouldShowTrailer: boolean;
}

export function useTrailer(movieId: number, options: UseTrailerOptions = {}): UseTrailerResult {
  const { hoverDelay = 800, enabled = true } = options;

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowTrailer, setShouldShowTrailer] = useState(false);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch trailer
  const fetchTrailer = useCallback(async () => {
    if (!enabled || !isApiConfigured()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const key = await getCachedTrailer(movieId);
      setTrailerKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trailer');
    } finally {
      setIsLoading(false);
    }
  }, [movieId, enabled]);

  // Handle hover start
  const onHoverStart = useCallback(() => {
    // Clear any existing timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Start fetching trailer immediately (don't wait for delay)
    if (!trailerKey && !isLoading) {
      fetchTrailer();
    }

    // Delay before showing the trailer
    hoverTimeoutRef.current = setTimeout(() => {
      setShouldShowTrailer(true);
    }, hoverDelay);
  }, [hoverDelay, trailerKey, isLoading, fetchTrailer]);

  // Handle hover end
  const onHoverEnd = useCallback(() => {
    setShouldShowTrailer(false);

    // Clear timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    trailerKey,
    isLoading,
    error,
    onHoverStart,
    onHoverEnd,
    shouldShowTrailer: shouldShowTrailer && !!trailerKey,
  };
}

// Hook specifically for the hero/billboard section
// This prefetches the trailer immediately
export function useHeroTrailer(movieId: number | null): {
  trailerKey: string | null;
  isLoading: boolean;
} {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (movieId === null || !isApiConfigured()) {
      return;
    }

    const id = movieId;

    async function fetchTrailer() {
      setIsLoading(true);
      try {
        const key = await getCachedTrailer(id);
        setTrailerKey(key);
      } catch {
        // Silently fail for hero trailer
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrailer();
  }, [movieId]);

  return { trailerKey, isLoading };
}
