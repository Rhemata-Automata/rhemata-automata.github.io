import React from 'react';

function RightButtons({ onSettingsClick, onRandomClick }) {
  return (
    <div className="right-buttons">
      <button className="settings-btn" title="Settings" onClick={onSettingsClick}>
        <i class="fa fa-cog fa-lg"></i>
      </button>
      <button className="random-btn" title="Random Verse" onClick={onRandomClick}>
        <i class="fa fa-refresh fa-lg"></i>
      </button>
    </div>
  );
}

export default RightButtons;
