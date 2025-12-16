import { useState, useCallback, useEffect } from 'react';
import { throttle } from '../utils';

export function useFocusTracking(containerRef) {
  const [focusIndex, setFocusIndex] = useState(null);

  const handleScrollRaw = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const viewportHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const centerY = scrollTop + viewportHeight / 2;
    let minDistance = Infinity;
    let newFocusIndex = null;

    container.querySelectorAll('.text').forEach(el => {
      const index = parseInt(el.dataset.index, 10);
      const rowTop = el.offsetTop;
      const rowHeight = el.offsetHeight;
      const rowCenter = rowTop + rowHeight / 2;
      const distance = Math.abs(centerY - rowCenter);
      if (distance < minDistance) {
        minDistance = distance;
        newFocusIndex = index;
      }
    });

    if (newFocusIndex !== null) {
      setFocusIndex(prev => prev === newFocusIndex ? prev : newFocusIndex);
    }
  }, []);

  const handleScroll = throttle(handleScrollRaw, 64);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScroll();
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  const getFocusClass = (index) => {
    if (focusIndex === null) return '';
    const distance = Math.abs(index - focusIndex);
    return distance <= 3 ? `focus-${distance}` : '';
  };

  return { focusIndex, getFocusClass };
}
