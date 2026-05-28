import React, { useRef } from 'react';
import { Music, FolderPlus, ShieldCheck, Sparkles, Layers, Sliders } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { AppLogo } from './AppLogo';

export const Onboarding: React.FC<{
  onComplete: () => void;
}> = ({ onComplete }) => {
  const { scanLocalFiles, isScanning, scanProgress } = useMusic();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await scanLocalFiles(filesArray);
      onComplete();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await scanLocalFiles(filesArray);
      onComplete();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between px-6 py-8 overflow-y-auto no-scrollbar relative">
      {/* Absolute Ambient Background Blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex flex-col items-center pt-6 text-center z-10">
        <AppLogo size={84} rounded="26px" className="mb-5" />
        
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Sonus <span className="text-violet-400">Music</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1.5 max-w-xs">
          Premium Android Offline Audio Experience
        </p>
      </div>

      {/* Middle Feature Highlights */}
      <div className="flex flex-col gap-4 my-8 z-10 max-w-sm mx-auto w-full">
        <div className="flex items-start gap-3 bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800/60">
          <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">True Local Privacy</h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Instantly indexes your device's raw audio files. Zero telemetry, no online uploads.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800/60">
          <div className="p-2 bg-fuchsia-500/10 rounded-xl text-fuchsia-400 mt-0.5">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Professional Audio DSP</h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              10-band graphic equalizer, hardware bass booster, and real spatial convolution reverb.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800/60">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Dynamic Artwork Ambient</h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Immersive background UI that instantly blurs and recalibrates color palettes to the active track.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800/60">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Real-Time FFT Visualizer</h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Live spectrum processing mapped to bass, drums, and high-frequency wave peaks.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden native input pickers */}
      <input 
        type="file" 
        ref={folderInputRef} 
        onChange={handleFolderChange} 
        {...{ webkitdirectory: "true", directory: "true" } as any}
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

      {/* Bottom Action Area */}
      <div className="flex flex-col gap-3 z-10 max-w-sm mx-auto w-full pb-4">
        {isScanning ? (
          <div className="w-full bg-zinc-900 border border-violet-500/40 rounded-2xl p-4 flex flex-col items-center text-center">
            <div className="w-8 h-8 border-3 border-violet-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs font-semibold text-violet-300">Scanning Android Storage...</p>
            {scanProgress && (
              <div className="w-full mt-2">
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full transition-all duration-150"
                    style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 truncate px-2">
                  {scanProgress.currentFileName}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {scanProgress.current} / {scanProgress.total} files
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-violet-950 flex items-center justify-center gap-2 active-scale"
            >
              <FolderPlus className="w-5 h-5" />
              Scan Complete Music Folder
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-2xl font-medium text-xs tracking-wide border border-zinc-800 flex items-center justify-center gap-2 active-scale"
            >
              <Music className="w-4 h-4 text-zinc-400" />
              Select Individual Audio Files
            </button>

            <button
              onClick={onComplete}
              className="w-full py-3 text-zinc-500 hover:text-zinc-300 text-xs font-semibold tracking-wide active-scale"
            >
              Continue to App
            </button>
          </>
        )}
      </div>
    </div>
  );
};
