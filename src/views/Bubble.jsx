import React, { useEffect, useRef } from 'react';

function Bubble({ bubbleInfo, onClose, containerRef }) {
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (!bubbleInfo) return;

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
