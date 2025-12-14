import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import './App.css';
import { otBooks, ntBooks, throttle, debounce, constructVerseURL } from './utils';

function App() {
  const [bibleData, setBibleData] = useState([]);
  const [filteredBible, setFilteredBible] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState({});
  const [focusIndex, setFocusIndex] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef(null);
  const virtuosoRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const focus0Ref = useRef(null);
  const [focus0Height, setFocus0Height] = useState(60);

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
    if (focus0Ref.current) {
      setFocus0Height(focus0Ref.current.offsetHeight);
    }
  }, [focusIndex]);

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

  const jumpToRandom = () => {
    if (!filteredBible.length || !virtuosoRef.current) return;
    const randIndex = Math.floor(Math.random() * filteredBible.length);
    virtuosoRef.current.scrollToIndex({
      index: randIndex,
      align: 'center',
      behavior: 'auto'
    });
  };

  const handleRangeChanged = useCallback(throttle(({ startIndex, endIndex }) => {
    const viewportHeight = containerRef.current?.clientHeight || window.innerHeight;
    const offsetPixels = focus0Height * 0.6;
    const offsetItems = Math.round(offsetPixels / (viewportHeight / (endIndex - startIndex + 1)));
    const centerIndex = startIndex + Math.floor((endIndex - startIndex + 1) / 2) - offsetItems;
    setFocusIndex(Math.max(0, centerIndex));
  }, 100), [focus0Height]);

  const getFocusClass = (index) => {
    if (focusIndex === null) return '';
    const distance = Math.abs(index - focusIndex);
    return distance <= 3 ? `focus-${distance}` : '';
  };

  const allOT = otBooks.every(book => selectedBooks[book]);
  const allNT = ntBooks.every(book => selectedBooks[book]);

  const updateBooks = (booksArray, value) => {
    setSelectedBooks(prev => ({
      ...prev,
      ...Object.fromEntries(booksArray.map(book => [book, value === 'toggle' ? !prev[book] : value]))
    }));
  };

  const itemContent = (index) => {
    const verse = filteredBible[index];
    const ref = verse[0];
    const url = constructVerseURL(ref);
    const isFocus0 = focusIndex === index;
    return (
      <div
        ref={isFocus0 ? focus0Ref : null}
        className={`verse-row ${getFocusClass(index)}`}
      >
        <a href={url} target="_blank" rel="noopener noreferrer" className="ref">
          {ref}
        </a>
        <span className="text">{verse[1]}</span>
      </div>
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
        rangeChanged={handleRangeChanged}
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
                  <input type="checkbox" checked={allOT} onChange={(e) => updateBooks(otBooks, e.target.checked)} />
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
                  <input type="checkbox" checked={allNT} onChange={(e) => updateBooks(ntBooks, e.target.checked)} />
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
    </div>
  );
}

export default App;
