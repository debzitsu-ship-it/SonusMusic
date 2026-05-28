import React, { useState, useMemo, useRef } from 'react';
import { Play, Plus, Trash2, Heart, ArrowLeft, Image as ImageIcon, MoreVertical, X } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { savePlaylist } from '../../services/db';

export const PlaylistsView: React.FC = () => {
  const { playlists, songs, createPlaylist, removePlaylist, playSong, favorites, removeSongFromPlaylist } = useMusic();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Favorites collection simulated as a permanent playlist
  const favSongs = useMemo(() => {
    return songs.filter(s => favorites.has(s.id));
  }, [songs, favorites]);

  const activePlaylist = useMemo(() => {
    if (selectedPlaylistId === 'favorites') {
      return {
        id: 'favorites',
        name: 'Favorites',
        createdAt: 0,
        songIds: favSongs.map(s => s.id),
        coverArt: undefined,
        isCustom: false
      };
    }
    const found = playlists.find(p => p.id === selectedPlaylistId);
    if (found) {
      return { ...found, isCustom: true };
    }
    return null;
  }, [playlists, selectedPlaylistId, favSongs]);

  const activePlaylistSongs = useMemo(() => {
    if (!activePlaylist) return [];
    if (activePlaylist.id === 'favorites') return favSongs;
    return activePlaylist.songIds
      .map(id => songs.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
  }, [activePlaylist, songs, favSongs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  const handleEditCover = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && activePlaylist?.isCustom) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const url = ev.target?.result as string;
        if (url) {
          const updated = { ...activePlaylist, coverArt: url };
          // Remove injected transient flags before saving
          delete (updated as any).isCustom;
          await savePlaylist(updated);
          // Trigger local state re-render
          setSelectedPlaylistId(null);
          setTimeout(() => setSelectedPlaylistId(activePlaylist.id), 0);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Interior View
  if (activePlaylist) {
    return (
      <div className="w-full h-full overflow-y-auto no-scrollbar pb-32 animate-fade-in">
        <div className="sticky top-0 w-full px-5 py-3 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between z-20 border-b border-zinc-900 text-xs font-semibold text-zinc-300">
          <button
            onClick={() => setSelectedPlaylistId(null)}
            className="flex items-center gap-2 hover:text-white active-scale"
          >
            <ArrowLeft className="w-4 h-4" />
            Playlists
          </button>

          {activePlaylist.isCustom && (
            <button
              onClick={handleEditCover}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 active-scale"
            >
              <ImageIcon className="w-3 h-3" />
              Edit Cover
            </button>
          )}
        </div>

        {/* Hidden File Picker */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        <div className="px-5 pt-4 pb-6 flex items-end gap-4 border-b border-zinc-900/60 bg-gradient-to-b from-zinc-900/40 to-transparent">
          <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
            {activePlaylist.coverArt ? (
              <img src={activePlaylist.coverArt} alt="" className="w-full h-full object-cover" />
            ) : activePlaylist.id === 'favorites' ? (
              <Heart className="w-10 h-10 text-red-500 fill-red-500" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-2xl">
                {activePlaylist.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white tracking-tight truncate">
              {activePlaylist.name}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1">
              {activePlaylistSongs.length} {activePlaylistSongs.length === 1 ? 'track' : 'tracks'}
            </p>

            {activePlaylistSongs.length > 0 && (
              <button
                onClick={() => playSong(activePlaylistSongs[0], activePlaylistSongs)}
                className="mt-3 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-xs font-bold flex items-center gap-1 active-scale"
              >
                <Play className="w-3 h-3 fill-white" />
                Play Playlist
              </button>
            )}
          </div>
        </div>

        {/* Tracks List */}
        <div className="px-5 py-3 flex flex-col gap-1">
          {activePlaylistSongs.map((song) => (
            <div
              key={song.id}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/60 group"
            >
              <div 
                onClick={() => playSong(song, activePlaylistSongs)}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500">
                  {song.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-100 truncate">
                    {song.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {song.artist}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-zinc-500">
                  {Math.floor(song.duration / 60)}:{Math.floor(song.duration % 60).toString().padStart(2, '0')}
                </span>
                
                {/* 3 Dots Menu for Remove */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuSongId(activeMenuSongId === song.id ? null : song.id);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 bg-zinc-900/80 transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuSongId === song.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setActiveMenuSongId(null)}
                      />
                      <div className="absolute right-0 top-8 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50">
                        <button
                          onClick={async () => {
                            if (activePlaylist.id !== 'favorites') {
                              await removeSongFromPlaylist(activePlaylist.id, song.id);
                            }
                            setActiveMenuSongId(null);
                          }}
                          className="w-full px-3 py-2 text-xs text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-2"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove from Playlist
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Playlists List
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar px-5 py-2 pb-32">
      {/* Create Trigger */}
      <div className="mb-4">
        {isCreating ? (
          <form onSubmit={handleCreate} className="flex items-center gap-2 animate-fade-in">
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              className="flex-1 bg-zinc-900 text-xs text-white px-3 py-2 rounded-xl border border-zinc-800 outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl active-scale"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-2 bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 rounded-xl border border-zinc-800/80 flex items-center justify-center gap-2 text-xs font-semibold text-violet-400 active-scale transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Playlist
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {/* Permanent Favorites Playlist */}
        <div
          onClick={() => setSelectedPlaylistId('favorites')}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/60 cursor-pointer group"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                Favorites
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {favSongs.length} {favSongs.length === 1 ? 'track' : 'tracks'}
              </p>
            </div>
          </div>
        </div>

        {/* Custom Playlists */}
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/60 group"
          >
            <div 
              onClick={() => setSelectedPlaylistId(playlist.id)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                {playlist.coverArt ? (
                  <img src={playlist.coverArt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg">
                    {playlist.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                  {playlist.name}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {playlist.songIds.length} {playlist.songIds.length === 1 ? 'track' : 'tracks'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm(`Delete playlist "${playlist.name}"?`)) {
                  removePlaylist(playlist.id);
                }
              }}
              title="Delete Playlist"
              className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-red-600/20 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors active-scale shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
