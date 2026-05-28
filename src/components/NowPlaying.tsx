import React, { useState, useRef } from 'react';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Sliders, 
  ListMusic, 
  Activity,
  Heart
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { AudioStudio } from './AudioStudio';
import { AmbientBackground } from './AmbientBackground';

export const NowPlaying: React.FC = () => {
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const { 
    currentSong, 
    playbackState, 
    togglePlay, 
    playNext, 
    playPrevious, 
    seek, 
    isNowPlayingOpen, 
    setIsNowPlayingOpen,
    repeatMode,
    setRepeatMode,
    isShuffle,
    setIsShuffle,
    toggleFavorite,
    queue,
    queueIndex,
    removeFromQueue,
    playSong
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'controls' | 'queue' | 'visualizer'>('controls');
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [dragSeekTime, setDragSeekTime] = useState(0);

  // Gesture Tracker for Cover Artwork
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const lastTapTime = useRef(0);

  if (!isNowPlayingOpen || !currentSong) return null;

  const activeCover = currentSong.customArtUrl;

  // Touch Gesture Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;

    // Swipe Threshold
    if (Math.abs(diff) > 75) {
      if (diff > 0) {
        // Swipe Left -> Next Track
        playNext();
      } else {
        // Swipe Right -> Previous Track
        playPrevious();
      }
    }

    // Double Tap detection
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      togglePlay();
    }
    lastTapTime.current = now;
    
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Seekbar handling
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setDragSeekTime(time);
  };

  const handleSeekEnd = () => {
    seek(dragSeekTime);
    setIsDraggingSeek(false);
  };

  const currentTimeDisplay = isDraggingSeek ? dragSeekTime : playbackState.currentTime;

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between overflow-y-auto no-scrollbar animate-slide-up text-white select-none bg-black">
      {/* Blurred Album Art Background */}
      <AmbientBackground />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* 2. Top Header */}
      <div className="w-full px-6 pt-10 pb-2 flex items-center justify-between z-10">
        <button
          onClick={() => setIsNowPlayingOpen(false)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white active-scale"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
            Now Playing
          </span>
          <span className="text-xs text-zinc-300 font-medium truncate max-w-[200px]">
            {currentSong.album}
          </span>
        </div>

        <button
          onClick={() => toggleFavorite(currentSong.id)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white active-scale"
        >
          <Heart className={`w-5 h-5 ${currentSong.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* 3. Central View Area (Artwork, Queue, or Visualizer Settings) */}
      <div className="flex-1 w-full px-8 flex flex-col items-center justify-center z-10 relative">
        {activeTab === 'controls' && (
          <div className="w-full max-w-sm flex flex-col items-center animate-fade-in">
            {/* Massive Album Artwork with interactive Swipe & Tap features */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full aspect-square rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative group"
            >
              {activeCover ? (
                <img 
                  src={activeCover} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-6xl">
                  {currentSong.title.charAt(0)}
                </div>
              )}

              {/* Instructional Overlay on Hold */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none">
                <p className="text-xs font-bold text-white tracking-wider">SWIPE TO SKIP</p>
                <p className="text-[10px] text-zinc-300">DOUBLE TAP TO PLAY / PAUSE</p>
              </div>
            </div>

            {/* Song Metadata */}
            <div className="w-full flex items-center justify-between mt-8">
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-xl font-extrabold text-white tracking-tight truncate">
                  {currentSong.title}
                </h2>
                <p className="text-sm font-medium text-violet-300 truncate mt-0.5">
                  {currentSong.artist}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Drag-and-Drop / Playback Queue View */}
        {activeTab === 'queue' && (
          <div className="w-full h-full max-w-md flex flex-col animate-fade-in py-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 text-left">
              Current Playback Queue ({queue.length})
            </h3>
            
            <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-1">
              {queue.map((song, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${song.id}-${idx}`}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left ${
                      isCurrent ? 'bg-violet-600/30 border border-violet-500/40' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div 
                      onClick={() => playSong(song, queue)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="w-4 text-[10px] font-bold text-zinc-500 text-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isCurrent ? 'text-violet-300' : 'text-white'}`}>
                          {song.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 active-scale"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 4. Bottom Playback Studio Controls */}
      <div className="w-full px-8 pb-10 flex flex-col gap-4 z-10 max-w-md mx-auto">
        {/* Animated Custom Seekbar / Progress Bar */}
        <div className="w-full flex flex-col gap-2">
          {/* Progress Track Container */}
          <div className="relative w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden cursor-pointer group">
            {/* Filled Progress */}
            <div 
              className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-100 ease-out"
              style={{ 
                width: `${playbackState.duration > 0 ? (currentTimeDisplay / playbackState.duration) * 100 : 0}%` 
              }}
            >
              {/* Glow effect on progress */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Invisible range input for interaction */}
            <input
              type="range"
              min="0"
              max={playbackState.duration || 100}
              value={currentTimeDisplay}
              onMouseDown={() => setIsDraggingSeek(true)}
              onTouchStart={() => setIsDraggingSeek(true)}
              onChange={handleSeekChange}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-between text-[11px] font-medium text-zinc-400 px-0.5">
            <span className="text-zinc-300">{formatTime(currentTimeDisplay)}</span>
            <span className="text-zinc-500">{formatTime(playbackState.duration)}</span>
          </div>
        </div>

        {/* Major Playback Action Buttons */}
        <div className="flex items-center justify-between px-1">
          {/* Shuffle Toggle */}
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active-scale ${
              isShuffle ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-4.5 h-4.5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={playPrevious}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors active-scale"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/20 hover:scale-105 transition-all active-scale"
          >
            {playbackState.isPlaying ? (
              <Pause className="w-7 h-7 fill-black" />
            ) : (
              <Play className="w-7 h-7 fill-black translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={playNext}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors active-scale"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Repeat Mode Cycle */}
          <button
            onClick={() => {
              const modes: Array<typeof repeatMode> = ['off', 'all', 'one'];
              const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
              setRepeatMode(next);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active-scale relative ${
              repeatMode !== 'off' ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Repeat className="w-4.5 h-4.5" />
            {repeatMode === 'one' && (
              <span className="absolute text-[8px] font-bold bottom-1 right-2 bg-violet-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Auxiliary Modals / Tab Triggers */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-white/10 mt-1">
          <button
            onClick={() => setActiveTab(activeTab === 'controls' ? 'controls' : 'controls')}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
              activeTab === 'controls' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Player
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
              activeTab === 'queue' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Queue
          </button>

          <button
            onClick={() => setIsAudioStudioOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            DSP Studio
          </button>
        </div>
      </div>

      {/* Audio Studio Modal */}
      <AudioStudio 
        isOpen={isAudioStudioOpen} 
        onClose={() => setIsAudioStudioOpen(false)} 
      />
    </div>
  );
};
