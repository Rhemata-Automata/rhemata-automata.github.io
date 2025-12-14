import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [bibleData, setBibleData] = useState([]);
  const [filteredBible, setFilteredBible] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState({});
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [focusIndex, setFocusIndex] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef(null);
  const verseRefs = useRef([]);

  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const BUFFER_SIZE = 50;
  const LOAD_INCREMENT = 20;

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
        jumpToRandom(data);
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
    jumpToRandom(filtered);
  }, [selectedBooks, bibleData]);

  const jumpToRandom = (data = filteredBible) => {
    if (!data.length) return;
    const randIndex = Math.floor(Math.random() * data.length);
    const start = Math.max(0, randIndex - BUFFER_SIZE);
    const end = Math.min(data.length, randIndex + BUFFER_SIZE);
    setRange({ start, end });
    setTimeout(() => {
      if (!containerRef.current) return;
      const relativeIndex = randIndex - start;
      const node = verseRefs.current[relativeIndex];
      if (node) {
        node.scrollIntoView({ block: 'center' });
        setFocusIndex(relativeIndex);
      }
    }, 0);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;

    if (scrollTop < 50 && range.start > 0) {
      const newStart = Math.max(0, range.start - LOAD_INCREMENT);
      const oldHeight = scrollHeight;
      setRange(prev => ({ ...prev, start: newStart }));
      requestAnimationFrame(() => {
        const newHeight = container.scrollHeight;
        container.scrollTop = scrollTop + (newHeight - oldHeight);
      });
    }

    if (scrollHeight - scrollTop - clientHeight < 50 && range.end < filteredBible.length) {
      const newEnd = Math.min(filteredBible.length, range.end + LOAD_INCREMENT);
      setRange(prev => ({ ...prev, end: newEnd }));
    }

    const centerY = container.offsetTop + clientHeight / 2;
    let closestIndex = null;
    let smallestDelta = Infinity;
    verseRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const delta = Math.abs(elCenter - centerY);
      if (delta < smallestDelta) {
        smallestDelta = delta;
        closestIndex = i;
      }
    });
    if (closestIndex !== null && closestIndex !== focusIndex) {
      setFocusIndex(closestIndex);
    }
  };

  const onMouseDown = (e) => {
    isDragging.current = true;
    startY.current = e.pageY;
    startScrollTop.current = containerRef.current.scrollTop;
    containerRef.current.style.cursor = 'grabbing';
  };
  const endDrag = () => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const y = e.pageY;
    const walk = (y - startY.current) * 1.5;
    containerRef.current.scrollTop = startScrollTop.current - walk;
  };

  const visibleVerses = filteredBible.slice(range.start, range.end);

  const getFocusClass = (i) => {
    if (focusIndex == null) return '';
    const d = Math.abs(i - focusIndex);
    if (d === 0) return 'focus-0';
    if (d === 1) return 'focus-1';
    if (d === 2) return 'focus-2';
    if (d === 3) return 'focus-3';
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

  return (
    <div className="app-wrapper">
      <div
        className="scroll-container"
        ref={containerRef}
        onScroll={handleScroll}
        onMouseDown={onMouseDown}
        onMouseLeave={endDrag}
        onMouseUp={endDrag}
        onMouseMove={onMouseMove}
      >
        {visibleVerses.map((verse, i) => {
          const ref = verse[0];
          const url = constructVerseURL(ref);
          return (
            <div
              key={range.start + i}
              ref={el => (verseRefs.current[i] = el)}
              className={`verse-row ${getFocusClass(i)}`}
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ref"
              >
                {ref}
              </a>
              <span className="text">{verse[1]}</span>
            </div>
          );
        })}
      </div>
      <div className="right-buttons">
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          ⚙️
        </button>
        <button className="random-btn" onClick={() => jumpToRandom()}>
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
