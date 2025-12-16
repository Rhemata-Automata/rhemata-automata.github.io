import { useRef, useEffect } from 'react';
import { throttle, debounce } from '../utils';

export function useDragScroll(containerRef) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      isDragging.current = true;
      startY.current = e.pageY;
      startScrollTop.current = container.scrollTop;
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = throttle((e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const y = e.pageY;
      const walk = (y - startY.current) * 1.5;
      container.scrollTop = startScrollTop.current - walk;
    }, 64);

    const handleMouseUpOrLeave = debounce(() => {
      if (isDragging.current) {
        isDragging.current = false;
        container.style.cursor = 'grab';
      }
    }, 50);

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUpOrLeave);
    container.addEventListener('mouseleave', handleMouseUpOrLeave);
    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUpOrLeave);
      container.removeEventListener('mouseleave', handleMouseUpOrLeave);
    };
  }, [containerRef]);
}
