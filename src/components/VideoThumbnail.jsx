import { useState, useRef, useEffect } from 'react';

/**
 * Ensures only one video plays at a time across the whole feed
 */
export default function VideoThumbnail({ src, isVisible, ...props }) {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isVisible) {
      // Try to play when it becomes visible
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // Auto-play might be blocked by browser, that's fine
          console.debug("Autoplay prevented:", e);
        });
      }
    } else {
      // Pause when it leaves viewport
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isVisible]);

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      muted
      playsInline
      className="w-full h-full object-cover"
      {...props}
    />
  );
}
