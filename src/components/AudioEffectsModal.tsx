import React, { useState } from 'react';
import { Sliders, RotateCcw, Sparkles, Volume2, Waves } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../services/audio';

export const AudioEffectsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { settings, updateEqBands, updateEqPreset, updateBassBoost, updateReverb } = useMusic();
  const [activeTab, setActiveTab] = useState<'eq' | 'bass' | 'reverb'>('eq');

  if (!isOpen || !settings) return null;

  const handleBandChange = (index: number, value: number) => {
    const nextBands = [...settings.eqBands];
    nextBands[index] = value;
    updateEqBands(nextBands);
  };

  const handleResetEq = () => {
    updateEqPreset('Flat', EQ_PRESETS['Flat']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white select-none">
      <div 
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Hardware DSP Studio
              </h2>
              <p className="text-[10px] text-zinc-400">
                Real-Time Audio Frequency & Spatial Processing
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

        {/* Studio Sub-Tabs */}
        <div className="grid grid-cols-3 border-b border-zinc-900 text-center">
          <button
            onClick={() => setActiveTab('eq')}
            className={`py-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'eq' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            10-Band EQ
          </button>

          <button
            onClick={() => setActiveTab('bass')}
            className={`py-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'bass' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Bass Boost
          </button>

          <button
            onClick={() => setActiveTab('reverb')}
            className={`py-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'reverb' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Spatial Reverb
          </button>
        </div>

        {/* Tab 1: 10-Band Graphic Equalizer */}
        {activeTab === 'eq' && (
          <div className="p-6 flex flex-col gap-6 animate-fade-in">
            {/* Presets & Reset */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400">Preset:</span>
                <select
                  value={settings.eqPresets}
                  onChange={(e) => {
                    const name = e.target.value;
                    if (EQ_PRESETS[name]) {
                      updateEqPreset(name, EQ_PRESETS[name]);
                    }
                  }}
                  className="bg-zinc-900 text-xs font-bold text-amber-400 px-3 py-1.5 rounded-xl border border-zinc-800 outline-none"
                >
                  <option value="Custom">Custom Tuning</option>
                  {Object.keys(EQ_PRESETS).map((preset) => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleResetEq}
                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800 active-scale"
              >
                <RotateCcw className="w-3 h-3" />
                Flat
              </button>
            </div>

            {/* 10 Vertical Sliders */}
            <div className="flex items-center justify-between h-44 px-1">
              {EQ_FREQUENCIES.map((freq, index) => {
                const gain = settings.eqBands[index] || 0;
                const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
                
                return (
                  <div key={freq} className="flex flex-col items-center h-full justify-between">
                    <span className="text-[9px] font-mono text-zinc-500">
                      {gain > 0 ? `+${gain}` : gain}
                    </span>

                    <div className="flex-1 py-2 flex items-center justify-center">
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        onChange={(e) => handleBandChange(index, parseInt(e.target.value))}
                        className="eq-slider"
                      />
                    </div>

                    <span className="text-[9px] font-bold text-zinc-400">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Hardware Bass Booster */}
        {activeTab === 'bass' && (
          <div className="p-8 flex flex-col items-center justify-center gap-8 animate-fade-in text-center">
            <div className="w-36 h-36 rounded-full bg-zinc-900 border-4 border-zinc-800 flex flex-col items-center justify-center relative shadow-inner">
              {/* Dynamic active ring indicator */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="68"
                  cy="68"
                  r="62"
                  fill="transparent"
                  stroke="rgba(245, 158, 11, 0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="68"
                  cy="68"
                  r="62"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 62}`}
                  strokeDashoffset={`${2 * Math.PI * 62 * (1 - settings.bassBoost / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </svg>

              <Volume2 className="w-8 h-8 text-amber-400 mb-1" />
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {settings.bassBoost}%
              </span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                Low Gain
              </span>
            </div>

            <div className="w-full max-w-xs flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.bassBoost}
                onChange={(e) => updateBassBoost(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                <span>0% (Clean)</span>
                <span>100% (Maximum Sub-Bass)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Spatial Reverb Studio */}
        {activeTab === 'reverb' && (
          <div className="p-6 flex flex-col gap-4 animate-fade-in text-left">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Select an acoustic chamber space to synthesize parallel early and late wet audio reflections.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-1">
              {(['none', 'studio', 'room', 'hall', 'cathedral', 'plate'] as const).map((preset) => {
                const isActive = settings.reverbPreset === preset;

                const details: Record<string, { label: string; desc: string }> = {
                  none: { label: 'Dry (None)', desc: 'Pure direct audio' },
                  studio: { label: 'Intimate Studio', desc: 'Tight near-field reflections' },
                  room: { label: 'Acoustic Room', desc: 'Warm active wooden space' },
                  hall: { label: 'Concert Hall', desc: 'Lush wide orchestral tail' },
                  cathedral: { label: 'Cathedral', desc: 'Massive ambient decay' },
                  plate: { label: 'Metallic Plate', desc: 'Bright immediate reflections' }
                };

                const info = details[preset];

                return (
                  <button
                    key={preset}
                    onClick={() => updateReverb(preset)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all active-scale ${
                      isActive 
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{info.label}</span>
                        {isActive && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">{info.desc}</p>
                    </div>

                    <div className="mt-3">
                      <Waves className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-600'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Close Bar */}
        <div className="p-4 bg-zinc-900/50 border-t border-zinc-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl active-scale"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
