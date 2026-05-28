import React, { useState } from 'react';
import { Settings, Moon, Smartphone, Palette, FolderMinus, Zap, RefreshCw, Trash2, User, Mail } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { AppLogo } from './AppLogo';

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, clearLibrary } = useMusic();
  const [activeTab, setActiveTab] = useState<'theme' | 'audio' | 'storage' | 'about'>('theme');

  if (!isOpen || !settings) return null;

  const accents = [
    { name: 'Oto Violet', hex: '#8B5CF6' },
    { name: 'Electric Cyan', hex: '#06B6D4' },
    { name: 'Neon Magenta', hex: '#D946EF' },
    { name: 'Amber Gold', hex: '#F59E0B' },
    { name: 'Emerald Green', hex: '#10B981' },
    { name: 'Crimson Red', hex: '#EF4444' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white select-none">
      <div 
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Sonus Settings
              </h2>
              <p className="text-[10px] text-zinc-400">
                Persistent Global App Configuration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-3 border-b border-zinc-900 text-center shrink-0">
          <button
            onClick={() => setActiveTab('theme')}
            className={`py-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'theme' ? 'border-violet-500 text-violet-400 bg-violet-500/5' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Look & Feel
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`py-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'audio' ? 'border-violet-500 text-violet-400 bg-violet-500/5' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Playback
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'storage' ? 'border-violet-500 text-violet-400 bg-violet-500/5' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Library
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'about' ? 'border-violet-500 text-violet-400 bg-violet-500/5' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            About
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {/* Tab 1: Theme & Display */}
          {activeTab === 'theme' && (
            <div className="flex flex-col gap-6 animate-fade-in text-left">
              {/* AMOLED True Black Mode */}
              <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-xl text-zinc-300">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Pure AMOLED Black Mode</h3>
                    <p className="text-[10px] text-zinc-400">Saves display energy on modern screens</p>
                  </div>
                </div>

                {/* Custom Checkbox Toggle */}
                <button
                  onClick={() => updateSettings({ amoledMode: !settings.amoledMode })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings.amoledMode ? 'bg-violet-600' : 'bg-zinc-800'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    settings.amoledMode ? 'left-7' : 'left-1'
                  }`}></span>
                </button>
              </div>

              {/* Dynamic Accent Color Matrix */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-violet-400" />
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Interface Accent Palette
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {accents.map((acc) => {
                    const isActive = settings.accentColor === acc.hex;
                    return (
                      <button
                        key={acc.hex}
                        onClick={() => updateSettings({ accentColor: acc.hex })}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                          isActive 
                            ? 'bg-zinc-900 border-white text-white shadow-md' 
                            : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900'
                        }`}
                      >
                        <span 
                          className="w-5 h-5 rounded-full shadow-inner" 
                          style={{ backgroundColor: acc.hex }}
                        ></span>
                        <span className="text-[10px] font-semibold">{acc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Animation Speed Modifiers */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Interface Motion Speed
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'normal', 'fast'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => updateSettings({ animationSpeed: speed })}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        settings.animationSpeed === speed
                          ? 'bg-violet-600 text-white border-violet-400'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Audio & Gapless Playback */}
          {activeTab === 'audio' && (
            <div className="flex flex-col gap-6 animate-fade-in text-left">
              <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Gapless Engine</h3>
                    <p className="text-[10px] text-zinc-400">Eliminate loading delay between track sequences</p>
                  </div>
                </div>

                <button
                  onClick={() => updateSettings({ gaplessPlayback: !settings.gaplessPlayback })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings.gaplessPlayback ? 'bg-violet-600' : 'bg-zinc-800'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    settings.gaplessPlayback ? 'left-7' : 'left-1'
                  }`}></span>
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-zinc-300">Auto Crossfade Duration</span>
                  <span className="text-violet-400">{settings.crossfadeDuration}s</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                    style={{ width: `${(settings.crossfadeDuration / 12) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={settings.crossfadeDuration}
                    onChange={(e) => updateSettings({ crossfadeDuration: parseInt(e.target.value) })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  Blends output signals during track transitions. Set to 0s to disable.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: IndexedDB Storage & Excluded Folders */}
          {activeTab === 'storage' && (
            <div className="flex flex-col gap-6 animate-fade-in text-left">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FolderMinus className="w-4 h-4 text-red-400" />
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Excluded Directories Blacklist
                  </h3>
                </div>

                <p className="text-[10px] text-zinc-400 mb-3">
                  Audio tracks mapped inside these specific directory paths are permanently blocked from local indexing.
                </p>

                {settings.excludedFolders && settings.excludedFolders.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {settings.excludedFolders.map((folder) => (
                      <div
                        key={folder}
                        className="flex items-center justify-between bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800"
                      >
                        <span className="text-xs font-mono text-zinc-300 truncate max-w-[240px]">
                          {folder}
                        </span>

                        <button
                          onClick={() => {
                            const next = settings.excludedFolders.filter(f => f !== folder);
                            updateSettings({ excludedFolders: next });
                          }}
                          title="Restore and Unhide Folder"
                          className="text-zinc-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-zinc-900/40 rounded-xl border border-zinc-800/60">
                    <p className="text-xs text-zinc-500">No excluded folders</p>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-900 pt-4">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to completely erase your IndexedDB media catalog? This will un-index all local references.")) {
                      clearLibrary();
                      onClose();
                    }
                  }}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active-scale"
                >
                  <RefreshCw className="w-4 h-4" />
                  Erase Local Storage Index
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: About */}
          {activeTab === 'about' && (
            <div className="flex flex-col gap-6 animate-fade-in text-center py-4">
              <div className="flex flex-col items-center">
                <AppLogo size={84} rounded="26px" className="mb-4" />
                <h2 className="text-xl font-bold text-white">Sonus Music</h2>
                <p className="text-xs text-zinc-400 mt-1">Premium Local Audio Experience</p>
              </div>

              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-400" />
                  Developer
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Name</p>
                    <p className="text-sm font-semibold text-white">Debjit Roy</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Email</p>
                    <a 
                      href="mailto:debzitsu@gmail.com" 
                      className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      debzitsu@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  If you have any queries or suggestions, feel free to contact. Your feedback helps make Sonus Music better!
                </p>
              </div>

              <p className="text-[10px] text-zinc-600">
                © 2025 Sonus Music. All rights reserved.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Close Bar */}
        <div className="p-4 bg-zinc-900/50 border-t border-zinc-900 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl active-scale"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
