import React, { useMemo } from 'react';
import { otBooks, ntBooks } from '../utils';


function Settings({ isOpen, onClose, selectedBooks, onBooksChange }) {
  const otSelected = useMemo(() => otBooks.every(book => selectedBooks[book]), [selectedBooks]);
  const ntSelected = useMemo(() => ntBooks.every(book => selectedBooks[book]), [selectedBooks]);


  const updateBooks = (booksArray, value) => {
    onBooksChange(prev => ({
      ...prev,
      ...Object.fromEntries(booksArray.map(book => [book, value === 'toggle' ? !prev[book] : value]))
    }));
  };


  if (!isOpen) return null;


  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings: Select Books</h2>
          <button className="close-btn" onClick={onClose} title="Close">
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div className="testaments">
          <div className="ot">
            <label className="testament-labels">
              <input
                type="checkbox"
                checked={otSelected}
                onChange={(e) => updateBooks(otBooks, e.target.checked)}
              />
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
              <input
                type="checkbox"
                checked={ntSelected}
                onChange={(e) => updateBooks(ntBooks, e.target.checked)}
              />
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
        <div  className="close-btn-bottom">
          <button onClick={onClose}>Close</button>
          </div>
      </div>
    </div>
  );
}


export default Settings;
