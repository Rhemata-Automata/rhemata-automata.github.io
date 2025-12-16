import React from 'react';
import parse from 'html-react-parser';

function TextItem({ item, index, focusClass, onVerseClick }) {
  if (item.length === 3) {
    return (
      <div className={`heading-${item[2]}`} data-index={index}>
        {item[1]}
      </div>
    );
  }

  return (
    <div 
      className={`text ${focusClass}`} 
      data-index={index} 
      onClick={(e) => onVerseClick(index, e)}
    >
      {parse(item[1])}
    </div>
  );
}

export default TextItem;
