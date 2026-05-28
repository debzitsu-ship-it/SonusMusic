import React, { useState, useRef } from 'react';
import { Search, Settings as SettingsIcon, Plus, FolderPlus, Music } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { AppLogo } from './AppLogo';

export const Header: React.FC<{
  onOpenSettings: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (o: boolean) => void;
}> = ({ onOpenSettings, isSearchOpen, setIsSearchOpen }) => {
  const { searchQuery, setSearchQuery, scanLocalFiles } = useMusic();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await scanLocalFiles(filesArray);
      setShowAddMenu(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await scanLocalFiles(filesArray);
      setShowAddMenu(false);
    }
  };

  return (
    <div className="w-full px-5 pt-3 pb-2 flex flex-col gap-3 shrink-0 z-30">
      <div className="flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-2.5">
          <AppLogo size={30} rounded="12px" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Sonus <span className="text-violet-400 font-medium text-sm">Music</span>
          </h2>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-1.5 relative">
          {/* Plus Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:bg-violet-600 hover:text-white transition-colors active-scale bg-zinc-900/80"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Add Menu Dropdown */}
            {showAddMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowAddMenu(false)}
                />
                <div className="absolute right-0 top-10 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3"
                  >
                    <FolderPlus className="w-4 h-4 text-violet-400" />
                    Scan Music Folder
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3"
                  >
                    <Music className="w-4 h-4 text-fuchsia-400" />
                    Select Audio Files
                  </button>
                </div>
              </>
            )}

            {/* Hidden Inputs - Native File Pickers */}
            <input 
              type="file" 
              ref={folderInputRef} 
              onChange={handleFolderChange}
              // @ts-ignore - webkitdirectory is a valid attribute
              webkitdirectory="true" 
              directory="true" 
              multiple 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="audio/*,.mp3,.flac,.wav,.aac,.ogg,.m4a,.opus" 
              multiple 
              className="hidden" 
            />
          </div>

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active-scale ${isSearchOpen ? 'bg-violet-600 text-white' : 'text-zinc-300 hover:bg-zinc-900/80'}`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:bg-zinc-900/80 transition-colors active-scale"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Integrated Instant Search Bar */}
      {isSearchOpen && (
        <div className="w-full animate-fade-in">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, albums, artists, folders..."
              className="w-full bg-zinc-900/90 text-white text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none border border-zinc-800 focus:border-violet-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
