import React, { useState, useMemo, useRef } from 'react';
import { Play, Shuffle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const AlbumsView: React.FC = () => {
  const { songs, playSong, editArtwork, searchQuery } = useMusic();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group unique albums
  const albums = useMemo(() => {
    const map = new Map<string, { title: string; artist: string; coverArt?: string; songCount: number }>();
    
    songs.forEach(s => {
      const key = s.album || 'Unknown Album';
      if (!map.has(key)) {
        map.set(key, {
          title: key,
          artist: s.artist || 'Unknown Artist',
          coverArt: s.customArtUrl,
          songCount: 1
        });
      } else {
        const existing = map.get(key)!;
        existing.songCount += 1;
        // Prefer explicit artwork if existing was empty
        if (!existing.coverArt && s.customArtUrl) {
          existing.coverArt = s.customArtUrl;
        }
      }
    });

    const list = Array.from(map.values());
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(a => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q));
  }, [songs, searchQuery]);

  // Songs belonging to selected album
  const albumSongs = useMemo(() => {
    if (!selectedAlbum) return [];
    return songs.filter(s => (s.album || 'Unknown Album') === selectedAlbum);
  }, [songs, selectedAlbum]);

  const handleEditAlbumArt = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedAlbum) {
      const file = e.target.files[0];
      // Update all songs belonging to this album
      for (const song of albumSongs) {
        await editArtwork(song.id, file);
      }
      e.target.value = '';
    }
  };

  // Interior Tracklist View
  if (selectedAlbum) {
    const albumInfo = albums.find(a => a.title === selectedAlbum) || {
      title: selectedAlbum,
      artist: albumSongs[0]?.artist || 'Unknown Artist',
      coverArt: albumSongs[0]?.customArtUrl
    };

    return (
      <div className="w-full h-full overflow-y-auto no-scrollbar pb-32 animate-fade-in">
        {/* Top Sticky Nav */}
        <div className="sticky top-0 w-full px-5 py-3 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between z-20 border-b border-zinc-900">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white active-scale"
          >
            <ArrowLeft className="w-4 h-4" />
            Albums
          </button>

          <button
            onClick={handleEditAlbumArt}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 active-scale"
          >
            <ImageIcon className="w-3 h-3" />
            Edit Cover
          </button>
        </div>

        {/* Hidden File Picker */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Album Header */}
        <div className="px-5 pt-4 pb-6 flex items-end gap-4 border-b border-zinc-900/60 bg-gradient-to-b from-zinc-900/40 to-transparent">
          <div className="w-28 h-28 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl shrink-0">
            {albumInfo.coverArt ? (
              <img src={albumInfo.coverArt} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-zinc-850 to-zinc-750 flex items-center justify-center text-zinc-500 font-bold text-2xl">
                {albumInfo.title.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white tracking-tight truncate">
              {albumInfo.title}
            </h2>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {albumInfo.artist}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">
              {albumSongs.length} {albumSongs.length === 1 ? 'track' : 'tracks'}
            </p>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => playSong(albumSongs[0], albumSongs)}
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-xs font-bold flex items-center gap-1 active-scale"
              >
                <Play className="w-3 h-3 fill-white" />
                Play
              </button>

              <button
                onClick={() => {
                  const shuffled = [...albumSongs].sort(() => Math.random() - 0.5);
                  playSong(shuffled[0], shuffled);
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold flex items-center gap-1 active-scale border border-zinc-800"
              >
                <Shuffle className="w-3 h-3" />
                Shuffle
              </button>
            </div>
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="px-5 py-3 flex flex-col gap-1">
          {albumSongs.map((song, idx) => (
            <div
              key={song.id}
              onClick={() => playSong(song, albumSongs)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/60 cursor-pointer group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-5 text-center text-xs font-semibold text-zinc-500 group-hover:text-white">
                  {song.trackNumber || idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-100 truncate">
                    {song.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {song.artist}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-medium text-zinc-500">
                {Math.floor(song.duration / 60)}:{Math.floor(song.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar px-5 py-3 pb-32">
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {albums.map((album) => (
          <div
            key={album.title}
            onClick={() => setSelectedAlbum(album.title)}
            className="flex flex-col cursor-pointer group"
          >
            <div className="w-full aspect-square rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden relative shadow-md">
              {album.coverArt ? (
                <img 
                  src={album.coverArt} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-zinc-850 to-zinc-750 flex items-center justify-center text-zinc-500 font-bold text-3xl">
                  {album.title.charAt(0)}
                </div>
              )}

              {/* Ambient count pill */}
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[9px] font-bold text-zinc-300">
                {album.songCount}
              </div>
            </div>

            <h3 className="text-xs font-bold text-white truncate mt-1.5 group-hover:text-violet-400 transition-colors">
              {album.title}
            </h3>
            <p className="text-[10px] text-zinc-400 truncate">
              {album.artist}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
