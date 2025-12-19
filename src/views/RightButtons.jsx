import React from 'react';

function RightButtons({ 
  onSettingsClick, 
  onRandomClick, 
  isScrolling, 
  onScrollToggle, 
  scrollSpeed, 
  onSpeedChange 
}) {
  return (
    <div className="right-buttons">
      <button className="settings-btn" title="Settings" onClick={onSettingsClick}>
        <i className="fa fa-cog fa-lg"></i>
      </button>
      <button className="random-btn" title="Random Verse" onClick={onRandomClick}>
        <i className="fa fa-refresh fa-lg"></i>
      </button>
      
      <div className="autoscroll-controls">
        <button 
          className={`autoscroll-btn ${isScrolling ? 'playing' : ''}`}
          title={isScrolling ? 'Pause autoscroll' : 'Start autoscroll'}
          onClick={onScrollToggle}
        >
          <i className={`fa ${isScrolling ? 'fa-pause' : 'fa-play'} fa-lg`}></i>
        </button>
        <input 
          type="range" 
          min="1" 
          max="100" 
          value={scrollSpeed} 
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className={`speed-slider ${isScrolling ? 'active' : ''}`}
          title={`Speed: ${scrollSpeed}%`}
        />
      </div>
    </div>
  );
}

export default RightButtons;
