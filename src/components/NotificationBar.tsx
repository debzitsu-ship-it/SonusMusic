import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const NotificationBar: React.FC = () => {
  const { 
    currentSong, 
    playbackState, 
    togglePlay, 
    playNext, 
    playPrevious,
    seek,
    isNowPlayingOpen
  } = useMusic();
  
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Update progress
  useEffect(() => {
    if (playbackState.duration > 0) {
      setProgress((playbackState.currentTime / playbackState.duration) * 100);
    }
  }, [playbackState.currentTime, playbackState.duration]);

  // Show notification when now playing is closed and song is playing
  useEffect(() => {
    if (currentSong && !isNowPlayingOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentSong, isNowPlayingOpen]);

  // Set up media session for native notification
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album,
        artwork: currentSong.customArtUrl ? [
          { src: currentSong.customArtUrl, sizes: '512x512', type: 'image/jpeg' }
        ] : []
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        seek(Math.max(0, playbackState.currentTime - 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        seek(Math.min(playbackState.duration, playbackState.currentTime + 10));
      });
    }
  }, [currentSong]);

  if (!isVisible || !currentSong) return null;

  const activeCover = currentSong.customArtUrl;

  return (
    <>
      {/* Custom Notification Bar */}
      <div className="fixed top-0 left-0 right-0 z-[200] bg-zinc-900/95 backdrop-blur-lg border-b border-zinc-800 animate-slide-down">
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Cover Art */}
          <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
            {activeCover ? (
              <img src={activeCover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold">
                {currentSong.title.charAt(0)}
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {currentSong.title}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              {currentSong.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Previous / Restart */}
            <button
              onClick={playPrevious}
              className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Previous / Restart"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {playbackState.isPlaying ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="px-4 pb-2">
          <div className="relative w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-violet-500 transition-all"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min="0"
              max={playbackState.duration || 100}
              value={playbackState.currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>{formatTime(playbackState.currentTime)}</span>
            <span>{formatTime(playbackState.duration)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
