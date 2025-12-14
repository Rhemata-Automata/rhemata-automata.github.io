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
    }, 100);
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
  const jumpToRandom = () => {
    if (!filteredBible.length || !virtuosoRef.current) return;
    const randIndex = Math.floor(Math.random() * filteredBible.length);
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
    const verse = filteredBible[index];
    const ref = verse[0];
    const url = constructVerseURL(ref);
    return (
      <div
        className={`verse-row ${getFocusClass(index)}`}
        data-index={index}
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
    </div>
  );
}
export default App;
