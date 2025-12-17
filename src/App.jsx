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
  const containerRef = useRef(null);
  const virtuosoRef = useRef(null);
  const { filteredBible, selectedBooks, setSelectedBooks } = useBibleData();
  const { hasMoved } = useDragScroll(containerRef);
  const { focusIndex, getFocusClass } = useFocusTracking(containerRef);
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
      hasMoved.current = false; // Reset for next interaction
      return; // Ignore click if it was part of a drag
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
