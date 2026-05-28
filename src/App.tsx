import React, { useState } from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { AndroidShell } from './components/AndroidShell';
import { Onboarding } from './components/Onboarding';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { SongsView } from './components/views/SongsView';
import { AlbumsView } from './components/views/AlbumsView';
import { ArtistsView } from './components/views/ArtistsView';
import { FoldersView } from './components/views/FoldersView';
import { PlaylistsView } from './components/views/PlaylistsView';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlaying } from './components/NowPlaying';
import { SettingsModal } from './components/SettingsModal';

const AppContent: React.FC = () => {
  const { activeTab, isNowPlayingOpen } = useMusic();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    () => localStorage.getItem('sonus_onboarding_seen') === 'true'
  );

  const completeOnboarding = () => {
    localStorage.setItem('sonus_onboarding_seen', 'true');
    setHasSeenOnboarding(true);
  };

  return (
    <AndroidShell>
      {!hasSeenOnboarding ? (
        <Onboarding onComplete={completeOnboarding} />
      ) : (
        <div className="w-full h-full flex flex-col relative">
          {/* Main Top Interface Navigation */}
          <Header 
            onOpenSettings={() => setIsSettingsOpen(true)} 
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
          />
          
          <Tabs />

          {/* Core Dynamic Content Container */}
          <div className="flex-1 w-full relative overflow-hidden">
            {activeTab === 'songs' && <SongsView />}
            {activeTab === 'albums' && <AlbumsView />}
            {activeTab === 'artists' && <ArtistsView />}
            {activeTab === 'folders' && <FoldersView />}
            {activeTab === 'playlists' && <PlaylistsView />}
          </div>

          {/* Floating Bottom Navigation Controls */}
          {!isNowPlayingOpen && <MiniPlayer />}

          {/* Full Screen High-Fidelity Views */}
          <NowPlaying />

          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        </div>
      )}
    </AndroidShell>
  );
};

export function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}

export default App;
