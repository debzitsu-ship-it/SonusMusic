import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  SongMetadata, 
  Playlist, 
  AppSettings, 
  getAllSongs, 
  getAllPlaylists, 
  getSettings, 
  saveSong, 
  getSongFile, 
  saveSettings, 
  savePlaylist, 
  deletePlaylist,
  updateSongMetadata,
  saveCustomArtwork,
  getCustomArtwork,
  clearEntireLibrary
} from '../services/db';
import { extractMetadata, extractColorsFromImage } from '../services/metadata';
import { audioEngine, AudioEngineState, ReverbPreset } from '../services/audio';

interface MusicContextType {
  // Library Collections
  songs: SongMetadata[];
  playlists: Playlist[];
  settings: AppSettings;
  favorites: Set<string>;
  
  // Navigation & UI State
  activeTab: 'songs' | 'albums' | 'artists' | 'folders' | 'playlists';
  setActiveTab: (tab: 'songs' | 'albums' | 'artists' | 'folders' | 'playlists') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
  currentColors: { primary: string; accent: string; darkPrimary: string };

  // Playback & Queue State
  currentSong: SongMetadata | null;
  playbackState: AudioEngineState;
  queue: SongMetadata[];
  queueIndex: number;
  repeatMode: 'off' | 'all' | 'one';
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean) => void;

  // Scanning & Operations
  isScanning: boolean;
  scanProgress: { current: number; total: number; currentFileName: string } | null;
  scanLocalFiles: (files: File[]) => Promise<void>;
  clearLibrary: () => Promise<void>;

  // Controls
  playSong: (song: SongMetadata, customQueue?: SongMetadata[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  
  // DSP Effects Modifiers
  updateEqBands: (bands: number[]) => void;
  updateEqPreset: (presetName: string, bands: number[]) => void;
  updateBassBoost: (level: number) => void;
  updateReverb: (preset: ReverbPreset) => void;
  
  // Advanced Audio Effects
  setPlaybackSpeed: (speed: number) => void;
  setDelay: (delayTime: number, feedback: number, mix: number) => void;
  setStereoWidth: (width: number) => void;
  setLowPassFilter: (frequency: number) => void;
  setHighPassFilter: (frequency: number) => void;
  setMuffleEffect: (amount: number) => void;
  setTrebleBoost: (level: number) => void;
  applyListeningMode: (mode: 'slowed' | 'nightcore' | 'lofi' | 'bass' | 'cinema' | 'chill' | 'vinyl' | 'radio' | 'cassette' | 'normal') => void;

  // Settings & Edits
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  editArtwork: (songId: string, imageFile: File) => Promise<void>;
  toggleFavorite: (songId: string) => void;

  // Queue Modifiers
  addToQueue: (song: SongMetadata) => void;
  playNextInQueue: (song: SongMetadata) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;

  // Playlists
  createPlaylist: (name: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removePlaylist: (playlistId: string) => Promise<void>;
  
  // Playlist Song Management
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // DB States
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // UI States
  const [activeTab, setActiveTab] = useState<'songs' | 'albums' | 'artists' | 'folders' | 'playlists'>('songs');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [currentColors, setCurrentColors] = useState({
    primary: '#18181b',
    accent: '#8B5CF6',
    darkPrimary: '#09090b'
  });

  // Audio Playback States
  const [currentSong, setCurrentSong] = useState<SongMetadata | null>(null);
  const [queue, setQueue] = useState<SongMetadata[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  
  const [playbackState, setPlaybackState] = useState<AudioEngineState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false
  });

  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentFileName: string } | null>(null);

  // Load Library & Settings on Mount
  useEffect(() => {
    async function loadInitialData() {
      const loadedSettings = await getSettings();
      setSettingsState(loadedSettings);

      const loadedSongs = await getAllSongs();
      const loadedPlaylists = await getAllPlaylists();
      
      setSongs(loadedSongs);
      setPlaylists(loadedPlaylists);

      // Populate Favorites Set
      const favs = new Set<string>();
      loadedSongs.forEach(s => { if (s.isFavorite) favs.add(s.id); });
      setFavorites(favs);

      // Apply startup DSP Settings
      audioEngine.setEqBands(loadedSettings.eqBands);
      audioEngine.setBassBoost(loadedSettings.bassBoost);
      audioEngine.setReverb(loadedSettings.reverbPreset as ReverbPreset);

      // Restore Last Playing status if preserved
      const lastSongId = localStorage.getItem('sonus_last_song_id');
      if (lastSongId && loadedSongs.length > 0) {
        const found = loadedSongs.find(s => s.id === lastSongId);
        if (found) {
          setCurrentSong(found);
          // Load custom cover colors if exist
          const customUrl = await getCustomArtwork(found.id);
          const activeCover = customUrl || found.customArtUrl || '';
          if (activeCover) {
            extractColorsFromImage(activeCover).then(setCurrentColors);
          }
        }
      }
    }
    loadInitialData();
  }, []);

  // Sync Audio Engine Callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      (currentTime) => {
        setPlaybackState(prev => ({ ...prev, currentTime }));
      },
      (partialState) => {
        setPlaybackState(prev => ({ ...prev, ...partialState }));
      },
      () => {
        // Track Ended naturally -> trigger auto Next Track
        handleTrackEnded();
      }
    );

    // Setup native System MediaSession integration
    audioEngine.setMediaSessionActionHandlers(
      () => setPlaybackState(prev => ({ ...prev, isPlaying: true })),
      () => setPlaybackState(prev => ({ ...prev, isPlaying: false })),
      () => playNext(),
      () => playPrevious()
    );
  }, [queue, queueIndex, repeatMode, isShuffle, currentSong]);

  // Handle automatic song transition on ending
  const handleTrackEnded = () => {
    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
    } else {
      playNext();
    }
  };

  // Full-Speed Background Storage Scanner
  const scanLocalFiles = async (files: File[]) => {
    if (isScanning || !settings) return;
    setIsScanning(true);
    setScanProgress({ current: 0, total: files.length, currentFileName: 'Initializing...' });

    const newSongs: SongMetadata[] = [];
    const existingIds = new Set(songs.map(s => s.id));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Filter Audio Types
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|flac|wav|aac|ogg|m4a|opus)$/i)) {
        continue;
      }

      // Check Excluded Folders
      const relativePath = file.webkitRelativePath || file.name;
      const folderName = relativePath.includes('/') ? relativePath.substring(0, relativePath.lastIndexOf('/')) : 'Root';
      
      if (settings.excludedFolders.some(ex => folderName.startsWith(ex))) {
        continue;
      }

      // Hash / ID Generation based on size and name
      const id = `${file.name}-${file.size}`;
      
      if (existingIds.has(id)) {
        setScanProgress({ current: i + 1, total: files.length, currentFileName: file.name });
        continue;
      }

      setScanProgress({ current: i + 1, total: files.length, currentFileName: file.name });
      
      // Real deep ID3 extraction
      const tags = await extractMetadata(file);

      const metadata: SongMetadata = {
        id,
        title: tags.title,
        artist: tags.artist,
        album: tags.album,
        genre: tags.genre,
        year: tags.year,
        duration: tags.duration,
        trackNumber: tags.trackNumber,
        addedAt: Date.now(),
        filePath: relativePath,
        folder: folderName,
        size: file.size,
        format: file.name.split('.').pop() || 'unknown',
        hasEmbeddedArt: !!tags.coverArtDataUrl,
        customArtUrl: tags.coverArtDataUrl,
        playCount: 0
      };

      await saveSong(metadata, file);
      newSongs.push(metadata);
    }

    if (newSongs.length > 0) {
      setSongs(prev => [...prev, ...newSongs]);
    }

    setIsScanning(false);
    setScanProgress(null);
  };

  const clearLibrary = async () => {
    await clearEntireLibrary();
    setSongs([]);
    setQueue([]);
    setCurrentSong(null);
    audioEngine.pause();
  };

  // Playback Operations
  const playSong = async (song: SongMetadata, customQueue?: SongMetadata[]) => {
    const file = await getSongFile(song.id);
    if (!file) {
      alert(`Could not load local audio file for "${song.title}". Please ensure permissions are intact.`);
      return;
    }

    // Set Queue
    let activeQueue = customQueue || queue;
    if (!customQueue && queue.length === 0) {
      activeQueue = songs;
    }
    
    setQueue(activeQueue);
    const index = activeQueue.findIndex(s => s.id === song.id);
    setQueueIndex(index !== -1 ? index : 0);
    
    setCurrentSong(song);
    localStorage.setItem('sonus_last_song_id', song.id);

    // Apply Live Color Extraction
    let activeArtwork = song.customArtUrl;
    const customEd = await getCustomArtwork(song.id);
    if (customEd) activeArtwork = customEd;

    if (activeArtwork) {
      const colors = await extractColorsFromImage(activeArtwork);
      setCurrentColors(colors);
    } else {
      setCurrentColors({ primary: '#18181b', accent: settings?.accentColor || '#8B5CF6', darkPrimary: '#09090b' });
    }

    // Trigger Playback
    await audioEngine.loadAndPlay(file);
    
    // Increment Play Count
    const updated = { ...song, playCount: song.playCount + 1, lastPlayed: Date.now() };
    updateSongMetadata(updated);
    setSongs(prev => prev.map(s => s.id === song.id ? updated : s));

    // System Media Session Info
    audioEngine.setMediaSessionMetadata(song.title, song.artist, song.album, activeArtwork);
  };

  const togglePlay = async () => {
    if (!currentSong && songs.length > 0) {
      await playSong(songs[0]);
      return;
    }
    if (playbackState.isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.play();
    }
  };

  const playNext = () => {
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return; // End of queue
      }
    }

    playSong(queue[nextIndex], queue);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;

    // If more than 3 seconds in, reset track to zero
    if (playbackState.currentTime > 3) {
      audioEngine.seek(0);
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    playSong(queue[prevIndex], queue);
  };

  const seek = (time: number) => {
    audioEngine.seek(time);
  };

  const setVolume = (v: number) => {
    audioEngine.setVolume(v);
  };

  // DSP Effects Modifiers
  const updateEqBands = (bands: number[]) => {
    if (!settings) return;
    const newSettings = { ...settings, eqBands: bands, eqPresets: 'Custom' };
    setSettingsState(newSettings);
    saveSettings(newSettings);
    audioEngine.setEqBands(bands);
  };

  const updateEqPreset = (presetName: string, bands: number[]) => {
    if (!settings) return;
    const newSettings = { ...settings, eqBands: bands, eqPresets: presetName };
    setSettingsState(newSettings);
    saveSettings(newSettings);
    audioEngine.setEqBands(bands);
  };

  const updateBassBoost = (level: number) => {
    if (!settings) return;
    const newSettings = { ...settings, bassBoost: level };
    setSettingsState(newSettings);
    saveSettings(newSettings);
    audioEngine.setBassBoost(level);
  };

  const updateReverb = (preset: ReverbPreset) => {
    if (!settings) return;
    const newSettings = { ...settings, reverbPreset: preset };
    setSettingsState(newSettings);
    saveSettings(newSettings);
    audioEngine.setReverb(preset);
  };

  // Advanced Audio Effects
  const setPlaybackSpeed = (speed: number) => {
    audioEngine.setPlaybackSpeed(speed);
  };

  const setDelay = (delayTime: number, feedback: number, mix: number) => {
    audioEngine.setDelay(delayTime, feedback, mix);
  };

  const setStereoWidth = (width: number) => {
    audioEngine.setStereoWidth(width);
  };

  const setLowPassFilter = (frequency: number) => {
    audioEngine.setLowPassFilter(frequency);
  };

  const setHighPassFilter = (frequency: number) => {
    audioEngine.setHighPassFilter(frequency);
  };

  const setMuffleEffect = (amount: number) => {
    audioEngine.setMuffleEffect(amount);
  };

  const setTrebleBoost = (level: number) => {
    audioEngine.setTrebleBoost(level);
  };

  const applyListeningMode = (mode: 'slowed' | 'nightcore' | 'lofi' | 'bass' | 'cinema' | 'chill' | 'vinyl' | 'radio' | 'cassette' | 'normal') => {
    audioEngine.applyPreset(mode);
  };

  // App Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    saveSettings(updated);

    // Apply Live Colors instantly
    if (newSettings.accentColor && !currentSong?.customArtUrl) {
      setCurrentColors(prev => ({ ...prev, accent: newSettings.accentColor! }));
    }
  };

  // Custom Album Cover Editor
  const editArtwork = async (songId: string, imageFile: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          await saveCustomArtwork(songId, dataUrl);
          
          // Update song object
          setSongs(prev => prev.map(s => {
            if (s.id === songId) {
              return { ...s, customArtUrl: dataUrl };
            }
            return s;
          }));

          // If current song, instantly recalculate dynamic UI theme
          if (currentSong?.id === songId) {
            setCurrentSong(prev => prev ? { ...prev, customArtUrl: dataUrl } : null);
            const colors = await extractColorsFromImage(dataUrl);
            setCurrentColors(colors);
            audioEngine.setMediaSessionMetadata(currentSong.title, currentSong.artist, currentSong.album, dataUrl);
          }
          resolve();
        } else {
          reject(new Error("Failed to read artwork file"));
        }
      };
      reader.readAsDataURL(imageFile);
    });
  };

  const toggleFavorite = (songId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      
      // Save status
      const song = songs.find(s => s.id === songId);
      if (song) {
        const updated = { ...song, isFavorite: next.has(songId) };
        updateSongMetadata(updated);
        setSongs(all => all.map(s => s.id === songId ? updated : s));
      }

      return next;
    });
  };

  // Queue Controls
  const addToQueue = (song: SongMetadata) => {
    setQueue(prev => [...prev, song]);
  };

  const playNextInQueue = (song: SongMetadata) => {
    setQueue(prev => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, song);
      return copy;
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    }
  };

  const reorderQueue = (startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      // Update QueueIndex accordingly
      if (queueIndex === startIndex) {
        setQueueIndex(endIndex);
      } else if (startIndex < queueIndex && endIndex >= queueIndex) {
        setQueueIndex(queueIndex - 1);
      } else if (startIndex > queueIndex && endIndex <= queueIndex) {
        setQueueIndex(queueIndex + 1);
      }

      return result;
    });
  };

  // Playlist Management
  const createPlaylist = async (name: string) => {
    const id = `playlist-${Date.now()}`;
    const newPlaylist: Playlist = {
      id,
      name,
      createdAt: Date.now(),
      songIds: []
    };
    await savePlaylist(newPlaylist);
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (!playlist.songIds.includes(songId)) {
      const updated = { ...playlist, songIds: [...playlist.songIds, songId] };
      await savePlaylist(updated);
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));
    }
  };

  const removePlaylist = async (playlistId: string) => {
    await deletePlaylist(playlistId);
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const updated = { ...playlist, songIds: playlist.songIds.filter(id => id !== songId) };
    await savePlaylist(updated);
    setPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));
  };

  if (!settings) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 text-sm tracking-wide">Initializing Premium Local Music Storage...</p>
      </div>
    );
  }

  return (
    <MusicContext.Provider
      value={{
        songs,
        playlists,
        settings,
        favorites,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        isNowPlayingOpen,
        setIsNowPlayingOpen,
        currentColors,
        currentSong,
        playbackState,
        queue,
        queueIndex,
        repeatMode,
        setRepeatMode,
        isShuffle,
        setIsShuffle,
        isScanning,
        scanProgress,
        scanLocalFiles,
        clearLibrary,
        playSong,
        togglePlay,
        playNext,
        playPrevious,
        seek,
        setVolume,
        updateEqBands,
        updateEqPreset,
        updateBassBoost,
        updateReverb,
        setPlaybackSpeed,
        setDelay,
        setStereoWidth,
        setLowPassFilter,
        setHighPassFilter,
        setMuffleEffect,
        setTrebleBoost,
        applyListeningMode,
        updateSettings,
        editArtwork,
        toggleFavorite,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        reorderQueue,
        createPlaylist,
        addSongToPlaylist,
        removePlaylist,
        removeSongFromPlaylist
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
