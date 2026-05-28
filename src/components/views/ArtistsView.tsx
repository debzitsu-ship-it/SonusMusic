import React, { useState, useMemo } from 'react';
import { Play, Shuffle, ArrowLeft, User } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const ArtistsView: React.FC = () => {
  const { songs, playSong, searchQuery } = useMusic();
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Group unique artists
  const artists = useMemo(() => {
    const map = new Map<string, { name: string; songCount: number; sampleCover?: string }>();

    songs.forEach(s => {
      const key = s.artist || 'Unknown Artist';
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          songCount: 1,
          sampleCover: s.customArtUrl
        });
      } else {
        const existing = map.get(key)!;
        existing.songCount += 1;
        if (!existing.sampleCover && s.customArtUrl) {
          existing.sampleCover = s.customArtUrl;
        }
      }
    });

    const list = Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(a => a.name.toLowerCase().includes(q));
  }, [songs, searchQuery]);

  // Songs belonging to selected artist
  const artistSongs = useMemo(() => {
    if (!selectedArtist) return [];
    return songs.filter(s => (s.artist || 'Unknown Artist') === selectedArtist);
  }, [songs, selectedArtist]);

  // Interior View
  if (selectedArtist) {
    const artistInfo = artists.find(a => a.name === selectedArtist) || {
      name: selectedArtist,
      sampleCover: artistSongs[0]?.customArtUrl
    };

    return (
      <div className="w-full h-full overflow-y-auto no-scrollbar pb-32 animate-fade-in">
        {/* Top Sticky Nav */}
        <div className="sticky top-0 w-full px-5 py-3 bg-zinc-950/80 backdrop-blur-md flex items-center gap-2 z-20 border-b border-zinc-900 text-xs font-semibold text-zinc-300">
          <button
            onClick={() => setSelectedArtist(null)}
            className="flex items-center gap-2 hover:text-white active-scale"
          >
            <ArrowLeft className="w-4 h-4" />
            Artists
          </button>
        </div>

        {/* Artist Header */}
        <div className="px-5 pt-4 pb-6 flex items-center gap-4 border-b border-zinc-900/60 bg-gradient-to-b from-zinc-900/40 to-transparent">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
            {artistInfo.sampleCover ? (
              <img src={artistInfo.sampleCover} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-zinc-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white tracking-tight truncate">
              {artistInfo.name}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {artistSongs.length} {artistSongs.length === 1 ? 'track' : 'tracks'}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => playSong(artistSongs[0], artistSongs)}
                className="px-3.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-xs font-bold flex items-center gap-1 active-scale"
              >
                <Play className="w-3 h-3 fill-white" />
                Play All
              </button>

              <button
                onClick={() => {
                  const shuffled = [...artistSongs].sort(() => Math.random() - 0.5);
                  playSong(shuffled[0], shuffled);
                }}
                className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold flex items-center gap-1 active-scale border border-zinc-800"
              >
                <Shuffle className="w-3 h-3" />
                Shuffle
              </button>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="px-5 py-3 flex flex-col gap-1">
          {artistSongs.map((song) => (
            <div
              key={song.id}
              onClick={() => playSong(song, artistSongs)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/60 cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500">
                  {song.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-100 truncate">
                    {song.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {song.album}
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

  // Artists List
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar px-5 py-2 pb-32">
      <div className="flex flex-col gap-1">
        {artists.map((artist) => (
          <div
            key={artist.name}
            onClick={() => setSelectedArtist(artist.name)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900/60 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
              {artist.sampleCover ? (
                <img src={artist.sampleCover} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-zinc-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                {artist.name}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {artist.songCount} {artist.songCount === 1 ? 'track' : 'tracks'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
