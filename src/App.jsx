import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import './App.css';
import { otBooks, ntBooks, throttle, debounce, constructVerseURL } from './utils';
function App() {
  const [bibleData, setBibleData] = useState([]);
  const [filteredBible, setFilteredBible] = useState([]);
  const [verseIndices, setVerseIndices] = useState([]);
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
        const allBooks = [...otBooks, ...ntBooks];
        setSelectedBooks(Object.fromEntries(allBooks.map(book => [book, true])));
        setFilteredBible(data);
      });
  }, []);
  useEffect(() => {
    if (!bibleData.length) return;
    const filtered = bibleData.filter(verse => {
      const ref = verse[0];
      const parts = ref.split(' ');
      const cv = parts.pop();
      const book = parts.join(' ');
      return selectedBooks[book] || false;
    });
    setFilteredBible(filtered);
  }, [selectedBooks, bibleData]);
  useEffect(() => {
    setVerseIndices(filteredBible.map((item, i) => item.length === 2 ? i : null).filter(i => i !== null));
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
  useEffect(() => {
    const handleScroll = throttle(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const viewportHeight = container.clientHeight;
      const scrollTop = container.scrollTop;
      const centerY = scrollTop + viewportHeight / 2;
      let minDistance = Infinity;
      let newFocusIndex = null;
      const verseRows = container.querySelectorAll('.verse-row');
      verseRows.forEach(el => {
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
      if (newFocusIndex !== null && newFocusIndex !== focusIndex) {
        setFocusIndex(newFocusIndex);
      }
    }, 64);
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); 
    }
    window.addEventListener('resize', handleScroll);
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleScroll);
    };
  }, [focusIndex]);
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
  const jumpToRandom = () => {
    if (!verseIndices.length || !virtuosoRef.current) return;
    const randIdx = Math.floor(Math.random() * verseIndices.length);
    const randIndex = verseIndices[randIdx];
    virtuosoRef.current.scrollToIndex({
      index: randIndex,
      align: 'center',
      behavior: 'auto'
    });
  };
  const getFocusClass = (index) => {
    if (focusIndex === null) return '';
    const distance = Math.abs(index - focusIndex);
    return distance <= 3 ? `focus-${distance}` : '';
  };
  const otSelected = otBooks.every(book => selectedBooks[book]);
  const ntSelected = ntBooks.every(book => selectedBooks[book]);
  const updateBooks = (booksArray, value) => {
    setSelectedBooks(prev => ({
      ...prev,
      ...Object.fromEntries(booksArray.map(book => [book, value === 'toggle' ? !prev[book] : value]))
    }));
  };
  const itemContent = (index) => {
    const item = filteredBible[index];
    const focusClass = getFocusClass(index);
    if (item.length === 3) {
      const level = item[2];
      const Heading = `h${level}`;
      return (
        <div className={`verse-row heading level-${level} ${focusClass}`} data-index={index}>
          <Heading>{item[1]}</Heading>
        </div>
      );
    } else {
      return (
        <div className={`verse-row ${focusClass}`} data-index={index}>
          <span className="text" onClick={(e) => handleVerseClick(index, e)}>
            {item[1]}
          </span>
        </div>
      );
    }
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