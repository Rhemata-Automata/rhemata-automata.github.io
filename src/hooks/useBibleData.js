import { useState, useEffect } from 'react';
import { otBooks, ntBooks } from '../utils';

export function useBibleData() {
  const [bibleData, setBibleData] = useState([]);
  const [filteredBible, setFilteredBible] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState({});

  // Load bible data
  useEffect(() => {
    fetch('/bible_flat.json')
      .then(res => res.json())
      .then(data => {
        setBibleData(data);
        setSelectedBooks(Object.fromEntries([...otBooks, ...ntBooks].map(book => [book, true])));
      });
  }, []);

  // Filter verses based on selected books
  useEffect(() => {
    if (!bibleData.length) return;
    const filtered = bibleData.filter(verse => {
      const bookName = typeof verse[0] === 'string' ? verse[0].replace(/ \d.+$/, '') : '';
      return selectedBooks[bookName];
    });
    setFilteredBible(filtered);
  }, [selectedBooks, bibleData]);

  return { filteredBible, selectedBooks, setSelectedBooks };
}
