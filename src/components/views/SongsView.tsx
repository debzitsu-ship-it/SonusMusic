import React, { useState, useRef, useMemo } from 'react';
import { Play, MoreVertical, Heart, Plus, Image as ImageIcon, ListMusic, Music2 } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { AppLogo } from '../AppLogo';

export const SongsView: React.FC = () => {
  const { songs, playSong, currentSong, playbackState, toggleFavorite, addToQueue, playNextInQueue, editArtwork, searchQuery, playlists, addSongToPlaylist, createPlaylist } = useMusic();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  const handleEditArtClick = (songId: string) => {
    setEditingSongId(songId);
    setActiveMenuId(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && editingSongId) {
      const file = e.target.files[0];
      await editArtwork(editingSongId, file);
      setEditingSongId(null);
      // Reset input
      e.target.value = '';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (songs.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center px-6 pb-24">
        <div className="flex flex-col items-center text-center max-w-xs">
          <AppLogo size={74} rounded="24px" className="mb-5" />
          <h3 className="text-lg font-bold text-white">Your library is empty</h3>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Tap the + button in the top bar to scan a music folder or import audio files. Your songs, playlists, artwork edits, and settings stay saved on this device.
          </p>
          <div className="mt-5 flex items-center gap-2 text-violet-400 text-xs font-semibold">
            <Music2 className="w-4 h-4" />
            Ready to build your library
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar px-5 py-2 pb-32">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4 mt-1">
        <span className="text-xs font-semibold text-zinc-400">
          {filteredSongs.length} {filteredSongs.length === 1 ? 'Track' : 'Tracks'}
        </span>

        {filteredSongs.length > 0 && (
          <button
            onClick={() => playSong(filteredSongs[0], filteredSongs)}
            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 active-scale shadow-md shadow-violet-950"
          >
            <Play className="w-3 h-3 fill-white" />
            Play All
          </button>
        )}
      </div>

      {/* Hidden artwork uploader */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Songs List */}
      <div className="flex flex-col gap-1">
        {filteredSongs.map((song) => {
          const isPlaying = currentSong?.id === song.id;
          const activeCover = song.customArtUrl;

          return (
            <div
              key={song.id}
              className={`w-full group flex items-center justify-between p-2 rounded-xl transition-colors relative ${
                isPlaying ? 'bg-violet-500/10 border border-violet-500/20' : 'hover:bg-zinc-900/60'
              }`}
            >
              {/* Primary left trigger area */}
              <div 
                onClick={() => playSong(song, filteredSongs)}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                {/* Artwork or index */}
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden shrink-0">
                  {activeCover ? (
                    <img src={activeCover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-xs">
                      {song.title.charAt(0)}
                    </div>
                  )}

                  {/* Active Equalizer animation overlay */}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-0.5">
                      {playbackState.isPlaying ? (
                        <>
                          <span className="w-1 h-3 bg-violet-400 rounded-full animate-[bounce_0.6s_infinite_alternate]"></span>
                          <span className="w-1 h-4 bg-violet-400 rounded-full animate-[bounce_0.4s_infinite_alternate]"></span>
                          <span className="w-1 h-2.5 bg-violet-400 rounded-full animate-[bounce_0.8s_infinite_alternate]"></span>
                        </>
                      ) : (
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full"></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isPlaying ? 'text-violet-400' : 'text-zinc-100'}`}>
                    {song.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[11px] text-zinc-400 truncate">
                      {song.artist}
                    </p>
                    <span className="text-[9px] text-zinc-600">•</span>
                    <p className="text-[10px] text-zinc-500 truncate shrink-0">
                      {song.album}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right secondary controls */}
              <div className="flex items-center gap-1 shrink-0 relative">
                {/* Duration */}
                <span className="text-[11px] font-medium text-zinc-500 mr-1">
                  {formatDuration(song.duration)}
                </span>

                {/* Favorite Toggle */}
                <button
                  onClick={() => toggleFavorite(song.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white active-scale"
                >
                  <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* Context Menu Button */}
                <button
                  onClick={() => setActiveMenuId(activeMenuId === song.id ? null : song.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white active-scale"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Inline Popover Menu */}
                {activeMenuId === song.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setActiveMenuId(null)}
                    ></div>
                    <div className="absolute right-0 top-9 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in text-left">
                      <button
                        onClick={() => {
                          playNextInQueue(song);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 text-violet-400" />
                        Play Next
                      </button>

                      <button
                        onClick={() => {
                          addToQueue(song);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-400" />
                        Add to Queue
                      </button>

                      <button
                        onClick={() => handleEditArtClick(song.id)}
                        className="w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        Edit Cover Art
                      </button>

                      <button
                        onClick={() => {
                          setShowPlaylistMenu(song.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                      >
                        <ListMusic className="w-3.5 h-3.5 text-cyan-400" />
                        Add to Playlist
                      </button>

                      <div className="w-full h-px bg-zinc-800 my-1"></div>

                      <div className="px-3 py-1 text-[9px] text-zinc-500 uppercase tracking-wider">
                        File Info
                      </div>
                      <div className="px-3 py-0.5 text-[10px] text-zinc-400 truncate">
                        Format: {song.format.toUpperCase()}
                      </div>
                      <div className="px-3 py-0.5 text-[10px] text-zinc-400 truncate">
                        Size: {(song.size / (1024 * 1024)).toFixed(1)} MB
                      </div>
                      <div className="px-3 py-0.5 text-[10px] text-zinc-400 truncate">
                        Plays: {song.playCount}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add to Playlist Modal */}
      {showPlaylistMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Add to Playlist</h3>
              <button 
                onClick={() => setShowPlaylistMenu(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400"
              >
                ✕
              </button>
            </div>

            {/* Create New Playlist Button */}
            {isCreatingPlaylist ? (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  autoFocus
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name..."
                  className="flex-1 bg-zinc-900 text-xs text-white px-3 py-2 rounded-xl border border-zinc-800 outline-none focus:border-violet-500"
                />
                <button
                  onClick={async () => {
                    if (newPlaylistName.trim()) {
                      await createPlaylist(newPlaylistName.trim());
                      setNewPlaylistName('');
                      setIsCreatingPlaylist(false);
                    }
                  }}
                  className="px-3 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl"
                >
                  Create
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingPlaylist(true)}
                className="w-full py-2.5 mb-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800/80 flex items-center justify-center gap-2 text-xs font-semibold text-violet-400"
              >
                <Plus className="w-4 h-4" />
                Create New Playlist
              </button>
            )}

            {/* Playlist List */}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {playlists.length === 0 && !isCreatingPlaylist ? (
                <p className="text-center text-xs text-zinc-500 py-4">No playlists yet</p>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={async () => {
                      await addSongToPlaylist(playlist.id, showPlaylistMenu);
                      setShowPlaylistMenu(null);
                    }}
                    className="w-full p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 text-left flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold">
                      {playlist.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{playlist.name}</p>
                      <p className="text-[10px] text-zinc-500">{playlist.songIds.length} tracks</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
