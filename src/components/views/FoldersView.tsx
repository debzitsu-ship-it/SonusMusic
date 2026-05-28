import React, { useMemo } from 'react';
import { Folder, FolderMinus, Play } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const FoldersView: React.FC = () => {
  const { songs, playSong, settings, updateSettings, searchQuery } = useMusic();

  // Extract real folders from scanned files
  const folders = useMemo(() => {
    const map = new Map<string, number>();
    
    songs.forEach(s => {
      const f = s.folder || 'Root';
      map.set(f, (map.get(f) || 0) + 1);
    });

    const list = Array.from(map.entries()).map(([path, count]) => ({
      path,
      name: path.includes('/') ? path.split('/').pop() || path : path,
      count
    })).sort((a,b) => a.name.localeCompare(b.name));

    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(f => f.path.toLowerCase().includes(q));
  }, [songs, searchQuery]);

  const handleExcludeFolder = (path: string) => {
    if (!settings) return;
    if (confirm(`Exclude folder "${path}"? This will hide all contained tracks from your library.`)) {
      const currentExclusions = settings.excludedFolders || [];
      if (!currentExclusions.includes(path)) {
        updateSettings({ excludedFolders: [...currentExclusions, path] });
      }
    }
  };

  const playFolder = (path: string) => {
    const folderSongs = songs.filter(s => (s.folder || 'Root') === path);
    if (folderSongs.length > 0) {
      playSong(folderSongs[0], folderSongs);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar px-5 py-2 pb-32">
      <div className="flex items-center justify-between mb-3 mt-1">
        <span className="text-xs font-semibold text-zinc-400">
          {folders.length} Scanned Directories
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {folders.map((folder) => {
          const isExcluded = settings?.excludedFolders?.includes(folder.path);

          if (isExcluded) return null;

          return (
            <div
              key={folder.path}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 group transition-colors"
            >
              <div 
                onClick={() => playFolder(folder.path)}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                  <Folder className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
                    {folder.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">
                    {folder.path}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-zinc-500 mr-1">
                  {folder.count} {folder.count === 1 ? 'file' : 'files'}
                </span>

                <button
                  onClick={() => playFolder(folder.path)}
                  title="Play Folder"
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-violet-600 flex items-center justify-center text-zinc-400 hover:text-white transition-colors active-scale"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleExcludeFolder(folder.path)}
                  title="Exclude Folder from Scanning"
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-red-600/20 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors active-scale"
                >
                  <FolderMinus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
