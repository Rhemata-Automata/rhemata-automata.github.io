import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import './App.css';

function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, Math.max(0, limit - (Date.now() - lastRan)));
    }
  };
}

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
  const [focus0Height, setFocus0Height] = useState(60); // fallback estimate

  const otBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
    'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ];

  const ntBooks = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
    'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
    'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];

  const constructVerseURL = (ref) => {
    const lastSpace = ref.lastIndexOf(' ');
    const bookPart = lastSpace > -1 ? ref.slice(0, lastSpace).trim() : ref.trim();
    const chapterVerse = lastSpace > -1 ? ref.slice(lastSpace + 1) : '';
    const [chapter, verse_range] = chapterVerse.split(':');
    const formatted_book = bookPart.replace(/\s+/g, '').toLowerCase().substring(0, 3);
    return `https://www.blueletterbible.org/csb/${formatted_book}/${chapter}/${verse_range}`;
  };

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
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      isDragging.current = true;
      startY.current = e.pageY;
      startScrollTop.current = container.scrollTop;
      container.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      container.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      container.style.cursor = 'grab';
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const y = e.pageY;
      const walk = (y - startY.current) * 1.5;
      container.scrollTop = startScrollTop.current - walk;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (focus0Ref.current) {
      setFocus0Height(focus0Ref.current.offsetHeight);
    }
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
    if (distance === 0) return 'focus-0';
    if (distance === 1) return 'focus-1';
    if (distance === 2) return 'focus-2';
    if (distance === 3) return 'focus-3';
    return '';
  };

  const allOT = otBooks.every(book => selectedBooks[book]);
  const allNT = ntBooks.every(book => selectedBooks[book]);

  const handleAllOT = (e) => {
    const checked = e.target.checked;
    setSelectedBooks(prev => ({
      ...prev,
      ...Object.fromEntries(otBooks.map(book => [book, checked]))
    }));
  };

  const handleAllNT = (e) => {
    const checked = e.target.checked;
    setSelectedBooks(prev => ({
      ...prev,
      ...Object.fromEntries(ntBooks.map(book => [book, checked]))
    }));
  };

  const toggleBook = (book) => {
    setSelectedBooks(prev => ({
      ...prev,
      [book]: !prev[book]
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
                  <input type="checkbox" checked={allOT} onChange={handleAllOT} />
                  Old Testament
                </label>
                <div className="books-columns">
                  {otBooks.map(book => (
                    <label key={book}>
                      <input
                        type="checkbox"
                        checked={selectedBooks[book]}
                        onChange={() => toggleBook(book)}
                      />
                      {book}
                    </label>
                  ))}
                </div>
              </div>
              <div className="nt">
                <label className="testament-labels">
                  <input type="checkbox" checked={allNT} onChange={handleAllNT} />
                  New Testament
                </label>
                <div className="books-columns">
                  {ntBooks.map(book => (
                    <label key={book}>
                      <input
                        type="checkbox"
                        checked={selectedBooks[book]}
                        onChange={() => toggleBook(book)}
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
