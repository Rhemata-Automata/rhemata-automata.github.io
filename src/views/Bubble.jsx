import React, { useEffect, useRef } from 'react';

function Bubble({ bubbleInfo, onClose, containerRef }) {
  const bubbleRef = useRef(null);
  const prevIndexRef = useRef(null);

  useEffect(() => {
    // Cleanup previous highlight when bubble closes or changes
    if (prevIndexRef.current !== null && containerRef.current) {
      const prevWrapper = containerRef.current.querySelector(`[data-index="${prevIndexRef.current}"]`);
      if (prevWrapper) {
        prevWrapper.classList.remove('highlighted-item');
      }
    }

    if (!bubbleInfo) {
      prevIndexRef.current = null;
      return;
    }

    // Highlight the new item wrapper
    prevIndexRef.current = bubbleInfo.index;

    const wrapper = containerRef.current?.querySelector(`[data-index="${bubbleInfo.index}"]`);
    if (wrapper) {
      wrapper.classList.add('highlighted-item');
      // Optional: gently scroll the verse into view if it's partially off-screen
      wrapper.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    const handleClickOutside = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleScrollHide = () => onClose();

    document.addEventListener('click', handleClickOutside);
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleScrollHide);
    }

    return () => {
      // Cleanup on unmount or when bubbleInfo changes
      if (wrapper) {
        wrapper.classList.remove('highlighted-item');
      }
      document.removeEventListener('click', handleClickOutside);
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScrollHide);
      }
    };
  }, [bubbleInfo, onClose, containerRef]);

  if (!bubbleInfo) return null;

  return (
    <div
      ref={bubbleRef}
      className="bubble"
      style={{
        position: 'fixed',
        left: `${bubbleInfo.position.left - 45}px`,
        top: `${bubbleInfo.position.top - 42}px`
      }}
    >
      <a href={bubbleInfo.url} target="_blank" rel="noreferrer">
        {bubbleInfo.ref}
      </a>
    </div>
  );
}

export default Bubble;
