import React from 'react';

function RightButtons({ onSettingsClick, onRandomClick }) {
  return (
    <div className="right-buttons">
      <button className="settings-btn" onClick={onSettingsClick}>
        ⚙️
      </button>
      <button className="random-btn" onClick={onRandomClick}>
        New Random
      </button>
    </div>
  );
}

export default RightButtons;
