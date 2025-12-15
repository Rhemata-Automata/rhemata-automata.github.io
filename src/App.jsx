import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import './App.scss';
import { otBooks, ntBooks, throttle, debounce, constructVerseURL } from './utils';
function App() {
  const [bibleData, setBibleData] = useState([]);
  const [filteredBible, setFilteredBible] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState({});
  const [focusIndex, setFocusIndex] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [bubbleInfo, setBubbleInfo] = useState(null);
  const containerRef = useRef(null);
  const virtuosoRef = useRef(null);
  const bubbleRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  useEffect(() => {
    fetch('/bible_flat.json')
      .then(res => res.json())
      .then(data => {
        setBibleData(data);
        setSelectedBooks(Object.fromEntries([...otBooks, ...ntBooks].map(book => [book, true])));
      });
  }, []);
  useEffect(() => {
    if (!bibleData.length) return;
    const filtered = bibleData.filter(verse => selectedBooks[verse[0].replace(/ \d.+$/, '')]);
    setFilteredBible(filtered);
  }, [selectedBooks, bibleData]);
  useEffect(() => {
    if (filteredBible.length > 0 && virtuosoRef.current) {
      jumpToRandom();
    }
  }, [filteredBible]);
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
  }, []);
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
  useEffect(() => {
    if (!bubbleInfo) return;
    const hideBubble = () => setBubbleInfo(null);
    const handleClickOutside = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        hideBubble();
      }
    };
    const handleScrollHide = () => hideBubble();
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
  }, [bubbleInfo]);
  const handleVerseClick = useCallback((index, e) => {
    e.stopPropagation();
    if (bubbleInfo && bubbleInfo.index === index) {
      setBubbleInfo(null);
      return;
    }
    const verse = filteredBible[index];
    const ref = verse[0];
    const url = constructVerseURL(ref);
    setBubbleInfo({
      index,
      ref,
      url,
      position: { left: e.clientX + 10, top: e.clientY + 10 }
    });
  }, [filteredBible, bubbleInfo]);
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
  const getFocusClass = (index) => {
    if (focusIndex === null) return '';
    const distance = Math.abs(index - focusIndex);
    return distance <= 3 ? `focus-${distance}` : '';
  };
  const otSelected = useMemo(() => otBooks.every(book => selectedBooks[book]), [selectedBooks]);
  const ntSelected = useMemo(() => ntBooks.every(book => selectedBooks[book]), [selectedBooks]);
  const updateBooks = (booksArray, value) => {
    setSelectedBooks(prev => ({
      ...prev,
      ...Object.fromEntries(booksArray.map(book => [book, value === 'toggle' ? !prev[book] : value]))
    }));
  };
  const itemContent = (index) => {
    const item = filteredBible[index];
    if (item.length === 3) {
      return (
        <div className={`heading-${item[2]}`} data-index={index}>
          {item[1]}
        </div>
      );
    }
    return (
      <div className={`text ${getFocusClass(index)}`} data-index={index} onClick={(e) => handleVerseClick(index, e)}>{item[1]}</div>
    );
  };

  return (
    <div className="app-wrapper">
      <Virtuoso
        ref={virtuosoRef}
        data={filteredBible}
        itemContent={itemContent}
        style={{ height: '100vh', width: '100%' }}
        scrollerRef={(ref) => { containerRef.current = ref; }}
      />
      <div className="right-buttons">
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          ⚙️
        </button>
        <button className="random-btn" onClick={jumpToRandom}>
          New Random
        </button>
      </div>
      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <h2>Settings: Select Books</h2>
            <div className="testaments">
              <div className="ot">
                <label className="testament-labels">
                  <input type="checkbox" checked={otSelected} onChange={(e) => updateBooks(otBooks, e.target.checked)} />
                  Old Testament
                </label>
                <div className="books-columns">
                  {otBooks.map(book => (
                    <label key={book}>
                      <input
                        type="checkbox"
                        checked={selectedBooks[book]}
                        onChange={() => updateBooks([book], 'toggle')}
                      />
                      {book}
                    </label>
                  ))}
                </div>
              </div>
              <div className="nt">
                <label className="testament-labels">
                  <input type="checkbox" checked={ntSelected} onChange={(e) => updateBooks(ntBooks, e.target.checked)} />
                  New Testament
                </label>
                <div className="books-columns">
                  {ntBooks.map(book => (
                    <label key={book}>
                      <input
                        type="checkbox"
                        checked={selectedBooks[book]}
                        onChange={() => updateBooks([book], 'toggle')}
                      />
                      {book}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)}>Close</button>
          </div>
        </div>
      )}
      {bubbleInfo && (
        <div
          ref={bubbleRef}
          className="bubble"
          style={{
            position: 'fixed',
            left: `${bubbleInfo.position.left}px`,
            top: `${bubbleInfo.position.top}px`
          }}
        >
          <a href={bubbleInfo.url} target="_blank" rel="noopener noreferrer">
            {bubbleInfo.ref}
          </a>
        </div>
      )}
    </div>
  );
}
export default App;
