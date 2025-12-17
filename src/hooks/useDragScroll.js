import { useRef, useEffect } from 'react';
import { throttle, debounce } from '../utils';

export function useDragScroll(containerRef) {
  const isDragging = useRef(false);
  const hasMoved = useRef(false); // Track if significant movement occurred
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      // Only activate on left button
      if (e.button !== 0) return;

      isDragging.current = true;
      hasMoved.current = false;
      startY.current = e.pageY;
      startScrollTop.current = container.scrollTop;
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = throttle((e) => {
      if (!isDragging.current) return;

      const deltaY = Math.abs(e.pageY - startY.current);

      // If moved more than 5px in any direction, consider it a drag
      if (deltaY > 5 || deltaX > 5) {
        hasMoved.current = true;
      }

      e.preventDefault();
      const walk = (e.pageY - startY.current) * 1.1; // Adjust multiplier for speed if needed
      container.scrollTop = startScrollTop.current - walk;
    }, 64);

    const handleMouseUpOrLeave = () => {
      if (isDragging.current) {
        isDragging.current = false;
        container.style.cursor = 'grab';
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUpOrLeave);
    container.addEventListener('mouseleave', handleMouseUpOrLeave);

    container.style.cursor = 'grab';
    container.style.userSelect = 'none'; // Prevent text selection during drag

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUpOrLeave);
      container.removeEventListener('mouseleave', handleMouseUpOrLeave);
    };
  }, [containerRef]);

  // Expose hasMoved for external use (to prevent bubble in TextItem)
  return { hasMoved };
}
