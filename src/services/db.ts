import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SongMetadata {
  id: string; // Unique ID (hash or path)
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  duration: number; // in seconds
  trackNumber: string;
  addedAt: number;
  filePath: string;
  folder: string;
  size: number;
  format: string;
  hasEmbeddedArt?: boolean;
  customArtUrl?: string; // Data URL or Blob URL if customized
  isFavorite?: boolean;
  playCount: number;
  lastPlayed?: number;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  songIds: string[];
  coverArt?: string;
}

export interface AppSettings {
  id: string; // 'user_settings'
  darkMode: boolean;
  amoledMode: boolean;
  accentColor: string; // Hex color
  visualizerStyle: 'waveform' | 'circular' | 'bars' | 'ambient' | 'flowing' | 'particles' | 'edge';
  visualizerIntensity: number;
  visualizerSensitivity: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  excludedFolders: string[];
  gaplessPlayback: boolean;
  crossfadeDuration: number;
  // Audio Effects
  eqPresets: string; // Currently active preset name
  eqBands: number[]; // 10 bands
  bassBoost: number; // 0 to 100
  reverbPreset: string; // 'none', 'studio', 'room', 'hall', 'cathedral', 'plate'
}

interface SonusDBSchema extends DBSchema {
  songs: {
    key: string;
    value: SongMetadata;
    indexes: {
      'by-artist': string;
      'by-album': string;
      'by-folder': string;
      'by-added': number;
    };
  };
  files: {
    key: string;
    value: File;
  };
  playlists: {
    key: string;
    value: Playlist;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  customArtwork: {
    key: string; // Song ID, Album Name, or Playlist ID
    value: { id: string; dataUrl: string };
  };
}

const DB_NAME = 'sonus_music_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<SonusDBSchema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SonusDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' });
          songStore.createIndex('by-artist', 'artist');
          songStore.createIndex('by-album', 'album');
          songStore.createIndex('by-folder', 'folder');
          songStore.createIndex('by-added', 'addedAt');
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customArtwork')) {
          db.createObjectStore('customArtwork', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const defaultSettings: AppSettings = {
  id: 'user_settings',
  darkMode: true,
  amoledMode: false,
  accentColor: '#8B5CF6', // Oto-inspired rich violet
  visualizerStyle: 'waveform',
  visualizerIntensity: 50,
  visualizerSensitivity: 50,
  animationSpeed: 'normal',
  excludedFolders: [],
  gaplessPlayback: true,
  crossfadeDuration: 0,
  eqPresets: 'Flat',
  eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bassBoost: 0,
  reverbPreset: 'none',
};

// Database APIs
export async function saveSong(metadata: SongMetadata, file: File) {
  const db = await getDB();
  const tx = db.transaction(['songs', 'files'], 'readwrite');
  await tx.objectStore('songs').put(metadata);
  await tx.objectStore('files').put(file, metadata.id);
  await tx.done;
}

export async function deleteSong(id: string) {
  const db = await getDB();
  const tx = db.transaction(['songs', 'files'], 'readwrite');
  await tx.objectStore('songs').delete(id);
  await tx.objectStore('files').delete(id);
  await tx.done;
}

export async function getAllSongs(): Promise<SongMetadata[]> {
  const db = await getDB();
  return await db.getAll('songs');
}

export async function getSongFile(id: string): Promise<File | undefined> {
  const db = await getDB();
  return await db.get('files', id);
}

export async function updateSongMetadata(metadata: SongMetadata) {
  const db = await getDB();
  await db.put('songs', metadata);
}

export async function saveCustomArtwork(id: string, dataUrl: string) {
  const db = await getDB();
  await db.put('customArtwork', { id, dataUrl });
}

export async function getCustomArtwork(id: string): Promise<string | undefined> {
  const db = await getDB();
  const res = await db.get('customArtwork', id);
  return res?.dataUrl;
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'user_settings');
  return settings || defaultSettings;
}

export async function saveSettings(settings: AppSettings) {
  const db = await getDB();
  await db.put('settings', settings);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return await db.getAll('playlists');
}

export async function savePlaylist(playlist: Playlist) {
  const db = await getDB();
  await db.put('playlists', playlist);
}

export async function deletePlaylist(id: string) {
  const db = await getDB();
  await db.delete('playlists', id);
}

export async function clearEntireLibrary() {
  const db = await getDB();
  const tx = db.transaction(['songs', 'files', 'customArtwork'], 'readwrite');
  await tx.objectStore('songs').clear();
  await tx.objectStore('files').clear();
  await tx.objectStore('customArtwork').clear();
  await tx.done;
}


