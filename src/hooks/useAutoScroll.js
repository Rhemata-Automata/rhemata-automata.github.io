import { useState, useRef, useEffect, useCallback } from 'react';

export function useAutoScroll(containerRef) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const autoScrollIntervalRef = useRef(null);

  const toggleScroll = useCallback(() => {
    setIsScrolling((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isScrolling || !containerRef.current) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    let accumulatedScroll = 0;
    const pixelsPerFrame = scrollSpeed / 50;
    const intervalTime = 64; 

    autoScrollIntervalRef.current = setInterval(() => {
      if (containerRef.current) {
        accumulatedScroll += pixelsPerFrame;
        
        if (accumulatedScroll >= 1) {
          const pixelsToScroll = Math.floor(accumulatedScroll);
          containerRef.current.scrollBy({ 
            top: pixelsToScroll, 
            behavior: 'smooth' 
          });
          accumulatedScroll -= pixelsToScroll;
        }
      }
    }, intervalTime);

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isScrolling, scrollSpeed, containerRef]);

  return {
    isScrolling,
    scrollSpeed,
    setScrollSpeed,
    toggleScroll
  };
}
