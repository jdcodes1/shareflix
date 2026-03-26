import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrailerPlayerProps {
  videoKey: string;
  isPlaying: boolean;
  isMuted?: boolean;
  onMuteChange?: (muted: boolean) => void;
  className?: string;
  onReady?: () => void;
  onError?: () => void;
  showControls?: boolean;
  posterUrl?: string;
}

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function TrailerPlayer({
  videoKey,
  isPlaying,
  isMuted = true,
  onMuteChange: _onMuteChange,
  className = '',
  onReady,
  onError,
  showControls = false,
  posterUrl,
}: TrailerPlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [ytLoaded, setYtLoaded] = useState(!!window.YT?.Player);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT?.Player) {
      setYtLoaded(true);
      return;
    }

    // Add script if not already added
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setYtLoaded(true);
    };
  }, []);

  // Initialize player once YT API is loaded
  useEffect(() => {
    if (!ytLoaded || !containerRef.current) return;

    const playerEl = document.createElement('div');
    containerRef.current.appendChild(playerEl);

    playerRef.current = new window.YT.Player(playerEl, {
      videoId: videoKey,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: showControls ? 1 : 0,
        loop: 1,
        playlist: videoKey,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: (event: any) => {
          setIsReady(true);
          if (isMuted) {
            event.target.mute();
          }
          onReady?.();
        },
        onError: () => onError?.(),
      },
    });

    return () => {
      playerRef.current?.destroy();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [ytLoaded, videoKey, showControls, onReady, onError]);

  // Handle play/pause
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, isReady]);

  // Handle mute/unmute
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    if (isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
    }
  }, [isMuted, isReady]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Poster image */}
      <AnimatePresence>
        {posterUrl && !isPlaying && (
          <motion.img
            src={posterUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-10"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* YouTube player container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:w-full [&_iframe]:h-full"
        style={{ transform: 'scale(1.5)', transformOrigin: 'center center' }}
      />

      {/* Gradient overlay */}
      {isPlaying && isReady && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      )}
    </div>
  );
}

// Compact trailer player for movie cards
interface CardTrailerPlayerProps {
  videoKey: string;
  isPlaying: boolean;
  isMuted?: boolean;
  posterUrl: string;
}

export function CardTrailerPlayer({ videoKey, isPlaying, isMuted = true, posterUrl }: CardTrailerPlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Initialize player using a dynamically-created child element
  // so YouTube's iframe replacement doesn't break React's DOM tree
  useEffect(() => {
    isMountedRef.current = true;

    if (!window.YT || !containerRef.current) return;

    const initPlayer = () => {
      if (!isMountedRef.current || !containerRef.current) return;

      try {
        // Create a child div for YouTube to replace, keeping the
        // React-managed container intact
        const playerEl = document.createElement('div');
        containerRef.current.appendChild(playerEl);

        playerRef.current = new window.YT.Player(playerEl, {
          videoId: videoKey,
          playerVars: {
            autoplay: 0,
            mute: 1,
            controls: 0,
            loop: 1,
            playlist: videoKey,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: () => {
              if (isMountedRef.current) {
                setIsReady(true);
              }
            },
          },
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
      }
    };

    if (window.YT?.Player) {
      initPlayer();
    }

    return () => {
      isMountedRef.current = false;
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
      playerRef.current = null;
      // Clear any remaining children from the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [videoKey]);

  // Handle play/pause
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, isReady]);

  // Handle mute/unmute
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    if (isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
    }
  }, [isMuted, isReady]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-md">
      {/* Poster - shown when not playing */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.img
            src={posterUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-10"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* YouTube player container */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: 'scale(2)',
          transformOrigin: 'center 80%',
        }}
      />
    </div>
  );
}
