import React from 'react';
import { useMusic } from '../context/MusicContext';

export const Tabs: React.FC = () => {
  const { activeTab, setActiveTab } = useMusic();

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'songs', label: 'Songs' },
    { id: 'albums', label: 'Albums' },
    { id: 'artists', label: 'Artists' },
    { id: 'folders', label: 'Folders' },
    { id: 'playlists', label: 'Playlists' }
  ];

  return (
    <div className="w-full px-5 border-b border-zinc-900 shrink-0 z-20">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 relative active-scale ${
                isActive 
                  ? 'text-white bg-zinc-900/90 border border-zinc-800' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-violet-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
