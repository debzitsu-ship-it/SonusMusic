import React from 'react';
import { useMusic } from '../context/MusicContext';

export const AndroidShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useMusic();

  const isAmoled = settings?.amoledMode;

  return (
    <div className={`w-screen h-screen flex flex-col select-none overflow-hidden ${isAmoled ? 'bg-black' : 'bg-zinc-950'} text-white`}>
      {/* Main App Workspace - Full height without status bar */}
      <div className="flex-1 w-full relative overflow-hidden flex flex-col">
        {children}
      </div>

      {/* Android Bottom Navigation Bar */}
      <div className="w-full h-4 bg-transparent flex items-center justify-center z-50 shrink-0 pb-1">
        <div className="w-32 h-1 bg-zinc-600/60 rounded-full"></div>
      </div>
    </div>
  );
};
