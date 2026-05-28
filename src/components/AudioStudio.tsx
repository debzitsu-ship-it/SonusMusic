import React, { useState } from 'react';
import { 
  Gauge, Clock, Volume2, Waves, Sparkles, 
  Disc, Radio, Music, Wind, Sliders,
  Activity, Zap, Headphones, Filter, Square
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { audioEngine } from '../services/audio';

export const AudioStudio: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { 
    setPlaybackSpeed, 
    applyListeningMode,
    setMuffleEffect,
    setStereoWidth,
    setDelay,
    setLowPassFilter,
    setHighPassFilter,
    setTrebleBoost,
    updateEqBands
  } = useMusic();

  const [activeCategory, setActiveCategory] = useState<'modes' | 'eq' | 'playback' | 'atmosphere' | 'texture' | 'character'>('modes');
  const [eqBands, setEqBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [speed, setSpeed] = useState(1.0);
  const [muffle, setMuffle] = useState(0);
  const [stereoWidth, setStereoWidthState] = useState(0);
  const [delayTime, setDelayTime] = useState(0);
  const [delayMix, setDelayMix] = useState(0);
  const [treble, setTreble] = useState(0);
  
  // Sound Character States
  const [warmth, setWarmth] = useState(0);
  const [air, setAir] = useState(0);
  const [crisp, setCrisp] = useState(0);
  const [depth, setDepth] = useState(0);
  const [punch, setPunch] = useState(0);
  const [boom, setBoom] = useState(0);
  const [compression, setCompression] = useState(0);
  
  // Texture States
  const [dreamy, setDreamy] = useState(0);
  const [hazy, setHazy] = useState(0);
  const [vintage, setVintage] = useState(0);
  const [bright, setBright] = useState(0);
  const [dark, setDark] = useState(0);
  
  if (!isOpen) return null;

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    setPlaybackSpeed(newSpeed);
  };

  const handleMuffleChange = (amount: number) => {
    setMuffle(amount);
    setMuffleEffect(amount);
  };

  const handleStereoChange = (width: number) => {
    setStereoWidthState(width);
    setStereoWidth(width);
  };

  const handleDelayChange = (time: number, mix: number) => {
    setDelayTime(time);
    setDelayMix(mix);
    setDelay(time, 0.4, mix);
  };

  const handleTrebleChange = (level: number) => {
    setTreble(level);
    setTrebleBoost(level);
  };

  const listeningModes = [
    { id: 'normal', label: 'Normal', icon: Music, color: 'bg-zinc-700', desc: 'Standard audio' },
    { id: 'slowed', label: 'Slowed', icon: Clock, color: 'bg-indigo-600', desc: '0.85x speed + reverb' },
    { id: 'nightcore', label: 'Nightcore', icon: Zap, color: 'bg-pink-600', desc: '1.25x speed + bright' },
    { id: 'lofi', label: 'Lo-Fi', icon: Disc, color: 'bg-amber-700', desc: 'Warm + tape feel' },
    { id: 'bass', label: 'Bass Boost', icon: Volume2, color: 'bg-violet-600', desc: 'Heavy low end' },
    { id: 'cinema', label: 'Cinema', icon: Headphones, color: 'bg-blue-600', desc: 'Wide + spacious' },
    { id: 'chill', label: 'Chill', icon: Wind, color: 'bg-teal-600', desc: 'Soft + relaxed' },
    { id: 'vinyl', label: 'Vinyl', icon: Disc, color: 'bg-orange-700', desc: 'Analog warmth' },
    { id: 'radio', label: 'Radio', icon: Radio, color: 'bg-red-600', desc: 'AM broadcast feel' },
    { id: 'cassette', label: 'Cassette', icon: Square, color: 'bg-yellow-700', desc: 'Tape nostalgia' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in text-white">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Audio Studio</h2>
              <p className="text-xs text-zinc-400">Real-time sound sculpting</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 border-b border-zinc-900">
          {[
            { id: 'modes', label: 'Modes', icon: Sparkles },
            { id: 'eq', label: 'Equalizer', icon: Sliders },
            { id: 'playback', label: 'Playback', icon: Activity },
            { id: 'atmosphere', label: 'Space', icon: Waves },
            { id: 'texture', label: 'Texture', icon: Filter },
            { id: 'character', label: 'Character', icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeCategory === tab.id 
                  ? 'border-violet-500 text-violet-400 bg-violet-500/5' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* MODES TAB */}
          {activeCategory === 'modes' && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              {listeningModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => applyListeningMode(mode.id as any)}
                  className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 hover:bg-zinc-900 transition-all text-left group active-scale"
                >
                  <div className={`w-10 h-10 rounded-xl ${mode.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <mode.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-sm">{mode.label}</h3>
                  {mode.desc && <p className="text-[10px] text-zinc-500 mt-0.5">{mode.desc}</p>}
                </button>
              ))}
            </div>
          )}

          {/* EQ TAB */}
          {activeCategory === 'eq' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-fuchsia-400" />
                    <span className="text-sm font-bold">10-Band Equalizer</span>
                  </div>
                  <button 
                    onClick={() => {
                      const flat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                      setEqBands(flat);
                      updateEqBands(flat);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-white"
                  >
                    Reset
                  </button>
                </div>
                
                {/* 10 Vertical Band Sliders */}
                <div className="flex justify-between items-end h-32 px-2">
                  {['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'].map((freq, index) => (
                    <div key={freq} className="flex flex-col items-center gap-2">
                      <div 
                        className="relative w-3 h-24 bg-zinc-800 rounded-full"
                        style={{ touchAction: 'none' }}
                      >
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-full transition-all pointer-events-none"
                          style={{ height: `${((eqBands[index] + 12) / 24) * 100}%` }}
                        />
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={eqBands[index]}
                          onChange={(e) => {
                            const newBands = [...eqBands];
                            newBands[index] = parseInt(e.target.value);
                            setEqBands(newBands);
                            updateEqBands(newBands);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          style={{ 
                            writingMode: 'vertical-lr', 
                            direction: 'rtl',
                            touchAction: 'none'
                          }}
                          onTouchStart={(e) => e.stopPropagation()}
                        />
                      </div>
                      <span className="text-[8px] text-zinc-500">{freq}</span>
                      <span className="text-[8px] text-zinc-400 font-bold">{eqBands[index] > 0 ? `+${eqBands[index]}` : eqBands[index]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* EQ Presets */}
              <div className="grid grid-cols-3 gap-2">
                {['Flat', 'Bass Boost', 'Vocal', 'Rock', 'Pop', 'Electronic'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      const presets: Record<string, number[]> = {
                        'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        'Bass Boost': [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
                        'Vocal': [-2, -2, 0, 2, 4, 4, 2, 0, -1, -2],
                        'Rock': [5, 4, 3, 1, -1, -1, 2, 4, 5, 5],
                        'Pop': [-1, -1, 0, 2, 3, 3, 1, 0, -1, -1],
                        'Electronic': [4, 3, 1, 0, -1, 2, 1, 1, 3, 4]
                      };
                      const bands = presets[preset] || presets['Flat'];
                      setEqBands(bands);
                      updateEqBands(bands);
                    }}
                    className="py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:border-fuchsia-500/50 hover:text-white active-scale"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PLAYBACK TAB */}
          {activeCategory === 'playback' && (
            <div className="space-y-6 animate-fade-in">
              {/* Speed Control */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-bold">Playback Speed</span>
                  </div>
                  <span className="text-violet-400 font-bold">{speed.toFixed(2)}x</span>
                </div>
                {/* Visible Custom Slider Track */}
              <div className="relative w-full h-2 bg-zinc-800 rounded-full mt-2">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${((speed - 0.5) / 1.5) * 100}%` }}
                />
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
                <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                  <span>0.5x Slow</span>
                  <span>1.0x Normal</span>
                  <span>2.0x Fast</span>
                </div>
              </div>

              {/* Quick Speed Presets */}
              <div className="grid grid-cols-5 gap-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      Math.abs(speed - s) < 0.01
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ATMOSPHERE TAB */}
          {activeCategory === 'atmosphere' && (
            <div className="space-y-6 animate-fade-in">
              {/* Stereo Width */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold">Stereo Width</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{stereoWidth > 0 ? `+${stereoWidth}` : stereoWidth}</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full mt-2">
                <div 
                  className="absolute top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                  style={{ 
                    left: stereoWidth < 0 ? `${50 + (stereoWidth * 50)}%` : '50%',
                    width: `${Math.abs(stereoWidth) * 50}%`
                  }}
                />
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={stereoWidth}
                  onChange={(e) => handleStereoChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
                <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                  <span>Left</span>
                  <span>Center</span>
                  <span>Right</span>
                </div>
              </div>

              {/* Delay/Echo */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold">Echo / Delay</span>
                  </div>
                  <span className="text-amber-400 font-bold">{Math.round(delayMix * 100)}%</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Delay Time</label>
                    <div className="relative w-full h-2 bg-zinc-800 rounded-full mt-1">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all"
                        style={{ width: `${delayTime * 100}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={delayTime}
                        onChange={(e) => handleDelayChange(parseFloat(e.target.value), delayMix)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">Mix Amount</label>
                    <div className="relative w-full h-2 bg-zinc-800 rounded-full mt-1">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all"
                        style={{ width: `${delayMix * 100}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={delayMix}
                        onChange={(e) => handleDelayChange(delayTime, parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEXTURE TAB */}
          {activeCategory === 'texture' && (
            <div className="space-y-6 animate-fade-in">
              {/* Muffle Effect */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold">Muffle / Underwater</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{Math.round(muffle * 100)}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full mt-2">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${muffle * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muffle}
                  onChange={(e) => handleMuffleChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
                <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                  <span>Clear</span>
                  <span>Muffled</span>
                  <span>Underwater</span>
                </div>
              </div>

              {/* Treble Boost */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-bold">Treble / Clarity</span>
                  </div>
                  <span className="text-rose-400 font-bold">{treble}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full mt-2">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${treble}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={treble}
                  onChange={(e) => handleTrebleChange(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              </div>

              {/* Dreamy - UNIQUE: Ethereal, spacious, floating */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Dreamy</span>
                  <span className="text-purple-400 font-bold">{dreamy}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all" style={{ width: `${dreamy}%` }} />
                  <input type="range" min="0" max="100" value={dreamy} onChange={(e) => { const val = parseInt(e.target.value); setDreamy(val); 
                    // Dreamy = Air + Reverb + slight pitch up feel + stereo width
                    audioEngine.setAir(val * 0.8);
                    audioEngine.setStereoWidth((val / 100) * 0.5);
                    audioEngine.setDelay(0.5, 0.6, val / 150);
                    audioEngine.setReverb(val > 30 ? 'hall' : 'room');
                    // No muffle - keep it clear but spacious
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Ethereal, spacious, floating atmosphere</p>
              </div>

              {/* Hazy - UNIQUE: Lo-fi, degraded, noisy */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Hazy</span>
                  <span className="text-stone-400 font-bold">{hazy}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-stone-500 to-zinc-400 rounded-full transition-all" style={{ width: `${hazy}%` }} />
                  <input type="range" min="0" max="100" value={hazy} onChange={(e) => { const val = parseInt(e.target.value); setHazy(val); 
                    // Hazy = Bit crush feel + heavy compression + mid scoop + noise
                    audioEngine.setMuffleEffect(val / 120);
                    audioEngine.setCompression(val * 1.5);
                    audioEngine.setLowPassFilter(12000 - (val * 80));
                    audioEngine.setHighPassFilter(80 + (val * 2));
                    // Add some saturation for "fuzzy" feel
                    audioEngine.setSaturation(val * 0.3);
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Lo-fi, degraded, fuzzy texture</p>
              </div>

              {/* Vintage - UNIQUE: Analog warmth with character */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Vintage</span>
                  <span className="text-amber-400 font-bold">{vintage}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full transition-all" style={{ width: `${vintage}%` }} />
                  <input type="range" min="0" max="100" value={vintage} onChange={(e) => { const val = parseInt(e.target.value); setVintage(val); 
                    // Vintage = Warmth + saturation + tape roll off + subtle wobble simulation via pitch
                    audioEngine.setWarmth(val * 0.9);
                    audioEngine.setSaturation(val * 0.7);
                    audioEngine.setLowPassFilter(16000 - (val * 40)); // Gentle rolloff
                    audioEngine.setBassBoost(val * 0.3); // Slight bass boost
                    // No delay, no reverb, no muffle - keep it dry and analog
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Analog warmth, tape saturation, retro</p>
              </div>

              {/* Bright - UNIQUE: Sparkle and presence */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Bright</span>
                  <span className="text-cyan-400 font-bold">{bright}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all" style={{ width: `${bright}%` }} />
                  <input type="range" min="0" max="100" value={bright} onChange={(e) => { const val = parseInt(e.target.value); setBright(val); 
                    // Bright = Multiple high frequency boosts, no low cuts
                    audioEngine.setBrightness(val);
                    audioEngine.setAir(val * 0.9);
                    audioEngine.setCrisp(val * 0.6);
                    audioEngine.setTrebleBoost(val * 0.8);
                    // Actually boost lows slightly too for contrast
                    audioEngine.setBassBoost(val * 0.2);
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Sparkling highs, vibrant, energetic</p>
              </div>

              {/* Dark - UNIQUE: Cinematic, moody, heavy */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Dark</span>
                  <span className="text-indigo-400 font-bold">{dark}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-600 to-slate-500 rounded-full transition-all" style={{ width: `${dark}%` }} />
                  <input type="range" min="0" max="100" value={dark} onChange={(e) => { const val = parseInt(e.target.value); setDark(val); 
                    // Dark = Deep bass, cut highs heavily, add depth
                    audioEngine.setDepth(val * 1.5); // Heavy sub-bass
                    audioEngine.setBoom(val * 0.6);
                    // Aggressive high cut
                    audioEngine.setLowPassFilter(10000 - (val * 60));
                    // Remove air and crisp completely
                    audioEngine.setAir(0);
                    audioEngine.setCrisp(0);
                    audioEngine.setBrightness(0);
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Cinematic, heavy bass, reduced highs</p>
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setLowPassFilter(800);
                    setHighPassFilter(20);
                  }}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:border-violet-500/50 active-scale"
                >
                  Low Pass
                </button>
                <button
                  onClick={() => {
                    setHighPassFilter(400);
                    setLowPassFilter(20000);
                  }}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:border-violet-500/50 active-scale"
                >
                  High Pass
                </button>
                <button
                  onClick={() => {
                    setLowPassFilter(20000);
                    setHighPassFilter(20);
                  }}
                  className="col-span-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:border-violet-500/50 active-scale"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* CHARACTER TAB */}
          {activeCategory === 'character' && (
            <div className="space-y-4 animate-fade-in">
              {/* Warmth */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Warmth</span>
                  <span className="text-amber-400 font-bold">{warmth}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" style={{ width: `${warmth}%` }} />
                  <input type="range" min="0" max="100" value={warmth} onChange={(e) => { setWarmth(parseInt(e.target.value)); audioEngine.setWarmth(parseInt(e.target.value)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Analog warmth and harmonic richness</p>
              </div>

              {/* Air */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Air</span>
                  <span className="text-sky-400 font-bold">{air}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full transition-all" style={{ width: `${air}%` }} />
                  <input type="range" min="0" max="100" value={air} onChange={(e) => { setAir(parseInt(e.target.value)); audioEngine.setAir(parseInt(e.target.value)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">High-frequency openness and sparkle</p>
              </div>

              {/* Crisp */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Crisp</span>
                  <span className="text-emerald-400 font-bold">{crisp}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${crisp}%` }} />
                  <input type="range" min="0" max="100" value={crisp} onChange={(e) => { setCrisp(parseInt(e.target.value)); audioEngine.setCrisp(parseInt(e.target.value)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Sharpness and transient clarity</p>
              </div>

              {/* Depth */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Depth</span>
                  <span className="text-indigo-400 font-bold">{depth}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${depth}%` }} />
                  <input type="range" min="0" max="100" value={depth} onChange={(e) => { setDepth(parseInt(e.target.value)); audioEngine.setDepth(parseInt(e.target.value)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Sub-bass atmosphere and cinematic weight</p>
              </div>

              {/* Punch */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Punch</span>
                  <span className="text-red-400 font-bold">{punch}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all" style={{ width: `${punch}%` }} />
                  <input type="range" min="0" max="100" value={punch} onChange={(e) => { setPunch(parseInt(e.target.value)); audioEngine.setPunch(parseInt(e.target.value)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Mid-bass impact and rhythmic energy</p>
              </div>

              {/* Boom */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Boom</span>
                  <span className="text-fuchsia-400 font-bold">{boom}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full transition-all" style={{ width: `${boom}%` }} />
                  <input type="range" min="0" max="100" value={boom} onChange={(e) => { setBoom(parseInt(e.target.value)); audioEngine.setBoom(parseInt(e.target.value)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Exaggerated sub-bass for club feel</p>
              </div>

              {/* Compression */}
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Compression</span>
                  <span className="text-yellow-400 font-bold">{compression}%</span>
                </div>
                <div className="relative w-full h-2 bg-zinc-800 rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all" style={{ width: `${compression}%` }} />
                  <input type="range" min="0" max="100" value={compression} onChange={(e) => { setCompression(parseInt(e.target.value)); audioEngine.setCompression(parseInt(e.target.value)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Dynamic range compression for tighter sound</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/50 border-t border-zinc-900 flex justify-between items-center gap-3">
          <button
            onClick={() => {
              applyListeningMode('normal');
              handleSpeedChange(1.0);
              handleMuffleChange(0);
              handleStereoChange(0);
              handleDelayChange(0, 0);
              handleTrebleChange(0);
              setWarmth(0); audioEngine.setWarmth(0);
              setAir(0); audioEngine.setAir(0);
              setCrisp(0); audioEngine.setCrisp(0);
              setDepth(0); audioEngine.setDepth(0);
              setPunch(0); audioEngine.setPunch(0);
              setBoom(0); audioEngine.setBoom(0);
              setCompression(0); audioEngine.setCompression(0);
              setDreamy(0); audioEngine.setMuffleEffect(0); audioEngine.setDelay(0, 0, 0);
              setHazy(0); audioEngine.setLowPassFilter(20000);
              setVintage(0); audioEngine.setSaturation(0);
              setBright(0); 
              setDark(0); audioEngine.setHighPassFilter(20);
            }}
            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
          >
            Reset All
          </button>
          

          <button
            onClick={onClose}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl active-scale"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
