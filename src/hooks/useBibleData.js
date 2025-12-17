import { useState, useEffect } from 'react';
import { otBooks, ntBooks } from '../utils';
export function useBibleData() {
  const [bibleData, setBibleData] = useState([]);
  const [filteredBible, setFilteredBible] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState(() => {
    const saved = localStorage.getItem('selectedBooks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing selectedBooks from localStorage:', error);
      }
    }
    return Object.fromEntries([...otBooks, ...ntBooks].map(book => [book, true]));
  });
  // Load bible data
  useEffect(() => {
    fetch('/bible_flat.json')
      .then(res => res.json())
      .then(data => {
        setBibleData(data);
      });
  }, []);
  // Save selectedBooks to localStorage
  useEffect(() => {
    localStorage.setItem('selectedBooks', JSON.stringify(selectedBooks));
  }, [selectedBooks]);
  // Filter verses based on selected books
  useEffect(() => {
    if (!bibleData.length) return;
    const filtered = bibleData.filter(verse => {
      const bookName = typeof verse[0] === 'string' ? verse[0].replace(/ \d+.*$/, '') : '';
      return selectedBooks[bookName];
    });
    setFilteredBible(filtered);
  }, [selectedBooks, bibleData]);
  return { filteredBible, selectedBooks, setSelectedBooks };
}
