import React from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const MiniPlayer: React.FC = () => {
  const { currentSong, playbackState, togglePlay, playNext, setIsNowPlayingOpen } = useMusic();

  if (!currentSong) return null;

  const progressPercent = playbackState.duration > 0 
    ? (playbackState.currentTime / playbackState.duration) * 100 
    : 0;

  const activeCover = currentSong.customArtUrl;

  return (
    <div className="absolute bottom-4 left-3 right-3 z-30 animate-fade-in">
      <div 
        onClick={() => setIsNowPlayingOpen(true)}
        className="w-full bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-2 flex items-center justify-between shadow-2xl shadow-black/80 cursor-pointer active-scale"
      >
        {/* Artwork & Track Info */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden shrink-0 relative">
            {activeCover ? (
              <img src={activeCover} alt="" className="w-full h-full object-cover animate-spin-slow" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-xs">
                {currentSong.title.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {currentSong.title}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Core Quick Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-zinc-800/60 active-scale"
          >
            {playbackState.isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
          </button>

          <button
            onClick={playNext}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/60 active-scale"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Live Active Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/50 rounded-b-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Glow tip */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
