import React from 'react';

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
      {item[1]}
    </div>
  );
}

export default TextItem;
