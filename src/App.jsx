import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import './App.scss';
import { constructVerseURL } from './utils';
import RightButtons from './views/RightButtons';
import Settings from './views/Settings';
import Bubble from './views/Bubble';
import TextItem from './views/TextItem';
import { useBibleData } from './hooks/useBibleData';
import { useDragScroll } from './hooks/useDragScroll';
import { useFocusTracking } from './hooks/useFocusTracking';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [bubbleInfo, setBubbleInfo] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  
  const containerRef = useRef(null);
  const virtuosoRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  
  const { filteredBible, selectedBooks, setSelectedBooks } = useBibleData();
  const { hasMoved } = useDragScroll(containerRef);
  const { focusIndex, getFocusClass } = useFocusTracking(containerRef);

  const calculateScrollDelay = useCallback((focusIndex) => {
    if (focusIndex === null) return 100;
    
    const focusElement = containerRef.current?.querySelector(`[data-index="${focusIndex}"] .text`);
    if (!focusElement) return 100;
    
    const wordCount = focusElement.textContent.split(/\s+/).filter(Boolean).length;
    const baseDelay = 100;
    const slowdownFactor = Math.max(0, wordCount - 15) * 0.01;
    
    return baseDelay * (1 + slowdownFactor);
  }, []);

  const handleScrollToggle = useCallback(() => {
    setIsScrolling(prev => !prev);
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
  }, 64);

  return () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };
}, [isScrolling, scrollSpeed, focusIndex, calculateScrollDelay]);


  const jumpToRandom = useCallback(() => {
    if (!filteredBible.length || !virtuosoRef.current) return;
    const verseIndices = filteredBible.map((item, i) => item.length === 2 ? i : null).filter(Boolean);
    if (!verseIndices.length) return;
    const randIndex = verseIndices[Math.floor(Math.random() * verseIndices.length)];
    virtuosoRef.current.scrollToIndex({
      index: randIndex,
      align: 'center',
      behavior: 'auto'
    });
  }, [filteredBible]);

  useEffect(() => {
    if (filteredBible.length > 0 && virtuosoRef.current) {
      jumpToRandom();
    }
  }, [filteredBible, jumpToRandom]);

  const handleVerseClick = useCallback((index, e) => {
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }

    e.stopPropagation();
    if (bubbleInfo && bubbleInfo.index === index) {
      setBubbleInfo(null);
      return;
    }
    const verse = filteredBible[index];
    const ref = String(verse[0]);
    const url = constructVerseURL(ref);
    setBubbleInfo({
      index,
      ref,
      url,
      position: { left: e.clientX, top: e.clientY }
    });
  }, [filteredBible, bubbleInfo, hasMoved]);

  const itemContent = useCallback((index) => {
    const item = filteredBible[index];
    const focusClass = getFocusClass(index);
    return (
      <TextItem
        item={item}
        index={index}
        focusClass={focusClass}
        onVerseClick={handleVerseClick}
      />
    );
  }, [filteredBible, getFocusClass, handleVerseClick]);

  return (
    <div className="app-wrapper">
      <Virtuoso
        ref={virtuosoRef}
        data={filteredBible}
        itemContent={itemContent}
        scrollerRef={(ref) => { containerRef.current = ref; }}
      />
      <RightButtons
        onSettingsClick={() => setShowSettings(true)}
        onRandomClick={jumpToRandom}
        isScrolling={isScrolling}
        onScrollToggle={handleScrollToggle}
        scrollSpeed={scrollSpeed}
        onSpeedChange={setScrollSpeed}
      />
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedBooks={selectedBooks}
        onBooksChange={setSelectedBooks}
      />
      <Bubble
        bubbleInfo={bubbleInfo}
        onClose={() => setBubbleInfo(null)}
        containerRef={containerRef}
      />
    </div>
  );
}

export default App;
