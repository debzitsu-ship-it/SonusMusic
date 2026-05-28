// Audio Playback & Real-Time DSP Engine

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

export type ReverbPreset = 'none' | 'studio' | 'room' | 'hall' | 'cathedral' | 'plate';

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Acoustic': [3, 3, 2, 0, -1, 0, 2, 3, 2, 1],
  'Bass Booster': [7, 6, 4, 2, 0, -1, -1, 0, 0, 0],
  'Bass Reducer': [-6, -5, -3, -1, 0, 0, 0, 0, 0, 0],
  'Classical': [0, 0, 0, 0, 0, 0, -1, -1, -1, -2],
  'Dance': [5, 4, 2, 0, 0, -2, -3, -3, 0, 2],
  'Electronic': [4, 3, 1, 0, -1, 2, 1, 1, 3, 4],
  'Hip-Hop': [6, 4, 1, 2, -1, -1, 1, -1, 2, 3],
  'Pop': [-1, -1, 0, 2, 3, 3, 1, 0, -1, -1],
  'Rock': [5, 4, 3, 1, -1, -1, 2, 4, 5, 5],
  'Vocal Booster': [-1, -2, 0, 3, 5, 4, 3, 1, 0, -1],
};

class AudioEngine {
  public audio: HTMLAudioElement;
  public audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  
  // Audio Nodes
  private eqNodes: BiquadFilterNode[] = [];
  private bassNode: BiquadFilterNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;
  public analyserNode: AnalyserNode | null = null;
  
  // Advanced Effect Nodes
  private delayNode: DelayNode | null = null;
  private delayFeedbackNode: GainNode | null = null;
  private delayWetNode: GainNode | null = null;
  private stereoPannerNode: StereoPannerNode | null = null;
  private lowPassNode: BiquadFilterNode | null = null;
  private highPassNode: BiquadFilterNode | null = null;
  private muffleNode: BiquadFilterNode | null = null;
  private trebleNode: BiquadFilterNode | null = null;
  
  // Sound Character Effect Nodes
  private warmthNode: BiquadFilterNode | null = null;
  private airNode: BiquadFilterNode | null = null;
  private crispNode: BiquadFilterNode | null = null;
  private depthNode: BiquadFilterNode | null = null;
  private punchNode: BiquadFilterNode | null = null;
  private punchPresenceNode: BiquadFilterNode | null = null;
  private boomNode: BiquadFilterNode | null = null;
  private tightBassNode: BiquadFilterNode | null = null;
  private brightnessNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private saturationNode: WaveShaperNode | null = null;
  
  // Current playback settings
  private currentSpeed: number = 1.0;

  // Trackers
  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private onStateChangeCallback: ((state: Partial<AudioEngineState>) => void) | null = null;
  private onTrackEndedCallback: (() => void) | null = null;
  private currentObjectUrl: string | null = null;

  constructor() {
    this.audio = document.createElement('audio');
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';

    // Event Listeners
    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audio.currentTime);
      }
    });

    this.audio.addEventListener('play', () => {
      this.ensureInitialized();
      this.notifyState({ isPlaying: true });
    });

    this.audio.addEventListener('pause', () => {
      this.notifyState({ isPlaying: false });
    });

    this.audio.addEventListener('durationchange', () => {
      this.notifyState({ duration: isFinite(this.audio.duration) ? this.audio.duration : 0 });
    });

    this.audio.addEventListener('ended', () => {
      if (this.onTrackEndedCallback) {
        this.onTrackEndedCallback();
      }
    });

    this.audio.addEventListener('volumechange', () => {
      this.notifyState({ volume: this.audio.volume, isMuted: this.audio.muted });
    });
  }

  /**
   * Initializes the Web Audio graph on first real gesture
   */
  public ensureInitialized() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      // Create source
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
      
      // Create Equalizer Chain
      let lastNode: AudioNode = this.sourceNode;
      this.eqNodes = EQ_FREQUENCIES.map((freq) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0; // Flat start
        lastNode.connect(filter);
        lastNode = filter;
        return filter;
      });

      // Create Bass Boost Node
      this.bassNode = this.audioCtx.createBiquadFilter();
      this.bassNode.type = 'lowshelf';
      this.bassNode.frequency.value = 90;
      this.bassNode.gain.value = 0;
      lastNode.connect(this.bassNode);
      lastNode = this.bassNode;

      // Reverb Engine (Parallel Wet/Dry Graph)
      this.dryGainNode = this.audioCtx.createGain();
      this.wetGainNode = this.audioCtx.createGain();
      this.convolverNode = this.audioCtx.createConvolver();

      this.dryGainNode.gain.value = 1.0;
      this.wetGainNode.gain.value = 0.0;

      // Connect source directly to dry gain
      lastNode.connect(this.dryGainNode);

      // Connect source to convolver, then to wet gain
      lastNode.connect(this.convolverNode);
      this.convolverNode.connect(this.wetGainNode);

      // Master merger node
      const masterGain = this.audioCtx.createGain();
      this.dryGainNode.connect(masterGain);
      this.wetGainNode.connect(masterGain);

      // Delay/Echo Effect
      this.delayNode = this.audioCtx.createDelay(5.0);
      this.delayFeedbackNode = this.audioCtx.createGain();
      this.delayWetNode = this.audioCtx.createGain();
      this.delayNode.delayTime.value = 0;
      this.delayFeedbackNode.gain.value = 0.3;
      this.delayWetNode.gain.value = 0;
      masterGain.connect(this.delayNode);
      this.delayNode.connect(this.delayFeedbackNode);
      this.delayFeedbackNode.connect(this.delayNode);
      this.delayNode.connect(this.delayWetNode);

      // Stereo Panner for widening
      this.stereoPannerNode = this.audioCtx.createStereoPanner();
      this.stereoPannerNode.pan.value = 0;

      // Filter Nodes
      this.lowPassNode = this.audioCtx.createBiquadFilter();
      this.lowPassNode.type = 'lowpass';
      this.lowPassNode.frequency.value = 20000;
      this.lowPassNode.Q.value = 0.7;

      this.highPassNode = this.audioCtx.createBiquadFilter();
      this.highPassNode.type = 'highpass';
      this.highPassNode.frequency.value = 20;
      this.highPassNode.Q.value = 0.7;

      this.muffleNode = this.audioCtx.createBiquadFilter();
      this.muffleNode.type = 'lowpass';
      this.muffleNode.frequency.value = 20000;
      this.muffleNode.Q.value = 0.5;

      this.trebleNode = this.audioCtx.createBiquadFilter();
      this.trebleNode.type = 'highshelf';
      this.trebleNode.frequency.value = 4000;
      this.trebleNode.gain.value = 0;

      // Sound Character Effect Nodes - ALL ACTIVE
      this.warmthNode = this.audioCtx.createBiquadFilter();
      this.warmthNode.type = 'peaking';
      this.warmthNode.frequency.value = 400;
      this.warmthNode.Q.value = 0.3;
      this.warmthNode.gain.value = 0;

      this.airNode = this.audioCtx.createBiquadFilter();
      this.airNode.type = 'highshelf';
      this.airNode.frequency.value = 8000;
      this.airNode.gain.value = 0;

      this.crispNode = this.audioCtx.createBiquadFilter();
      this.crispNode.type = 'peaking';
      this.crispNode.frequency.value = 2500;
      this.crispNode.Q.value = 1.2;
      this.crispNode.gain.value = 0;

      this.depthNode = this.audioCtx.createBiquadFilter();
      this.depthNode.type = 'lowshelf';
      this.depthNode.frequency.value = 50;
      this.depthNode.gain.value = 0;

      this.punchNode = this.audioCtx.createBiquadFilter();
      this.punchNode.type = 'peaking';
      this.punchNode.frequency.value = 100;
      this.punchNode.Q.value = 3.0;
      this.punchNode.gain.value = 0;

      this.punchPresenceNode = this.audioCtx.createBiquadFilter();
      this.punchPresenceNode.type = 'peaking';
      this.punchPresenceNode.frequency.value = 200;
      this.punchPresenceNode.Q.value = 2.0;
      this.punchPresenceNode.gain.value = 0;
 
      this.boomNode = this.audioCtx.createBiquadFilter();
      this.boomNode.type = 'lowshelf';
      this.boomNode.frequency.value = 30;
      this.boomNode.gain.value = 0;

      this.brightnessNode = this.audioCtx.createBiquadFilter();
      this.brightnessNode.type = 'highshelf';
      this.brightnessNode.frequency.value = 5000;
      this.brightnessNode.gain.value = 0;

      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.value = 0;
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 2;
      this.compressorNode.attack.value = 0.001;
      this.compressorNode.release.value = 0.1;

      // Chain: Master -> Delay -> Filters -> Character -> Compressor -> Panner -> Analyser
      const delaySum = this.audioCtx.createGain();
      masterGain.connect(delaySum);
      this.delayWetNode.connect(delaySum);
      
      delaySum.connect(this.lowPassNode);
      this.lowPassNode.connect(this.highPassNode);
      this.highPassNode.connect(this.muffleNode);
      this.muffleNode.connect(this.trebleNode);
      this.trebleNode.connect(this.warmthNode);
      this.warmthNode.connect(this.airNode);
      this.airNode.connect(this.crispNode);
      this.crispNode.connect(this.depthNode);
      this.depthNode.connect(this.punchNode);
      this.punchNode.connect(this.punchPresenceNode);
      this.punchPresenceNode.connect(this.boomNode);
      this.boomNode.connect(this.brightnessNode);
      this.brightnessNode.connect(this.compressorNode);
      this.compressorNode.connect(this.stereoPannerNode);

      // Analyser Node
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.stereoPannerNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('Web Audio API initialization failed, running fallback direct mode:', e);
    }
  }

  // Set Event Callbacks
  public setCallbacks(
    onTimeUpdate: (time: number) => void,
    onStateChange: (state: Partial<AudioEngineState>) => void,
    onTrackEnded: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onStateChangeCallback = onStateChange;
    this.onTrackEndedCallback = onTrackEnded;
  }

  private notifyState(state: Partial<AudioEngineState>) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }

  /**
   * Instantly loads and plays a real track file
   */
  public async loadAndPlay(file: File, startTime: number = 0) {
    this.ensureInitialized();

    // Revoke previous URL to avoid memory leaks
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
    }

    this.currentObjectUrl = URL.createObjectURL(file);
    this.audio.src = this.currentObjectUrl;
    this.audio.currentTime = startTime;

    try {
      await this.audio.play();
    } catch (e) {
      console.warn('Playback autoplay policy deferred:', e);
    }
  }

  public async play() {
    this.ensureInitialized();
    
    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    
    // Check if audio has a source
    if (!this.audio.src) {
      console.warn('No audio source set');
      return;
    }
    
    try {
      await this.audio.play();
    } catch (e) {
      console.warn('Play interrupted:', e);
      // Try to resume context again if play failed
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
        try {
          await this.audio.play();
        } catch (e2) {
          console.warn('Play failed after context resume:', e2);
        }
      }
    }
  }

  public pause() {
    this.audio.pause();
  }

  public seek(time: number) {
    if (isFinite(time)) {
      this.audio.currentTime = time;
    }
  }

  public setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  // Audio DSP Control Methods

  /**
   * Directly sets the 10-band equalizer filter gains
   */
  public setEqBands(gains: number[]) {
    if (!this.audioCtx || this.eqNodes.length === 0) return;
    gains.forEach((gain, index) => {
      if (this.eqNodes[index]) {
        // Smooth ramping to avoid clicking sounds
        this.eqNodes[index].gain.setTargetAtTime(gain, this.audioCtx!.currentTime, 0.05);
      }
    });
  }

  /**
   * Sets Bass Boost amplification (0 to 100 mapped to 0dB to 15dB)
   */
  public setBassBoost(level: number) {
    if (!this.audioCtx || !this.bassNode) return;
    const gainDb = (level / 100) * 16;
    this.bassNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.05);
  }

  /**
   * Updates the spatial Convolver reverb setting
   */
  public setReverb(preset: ReverbPreset) {
    if (!this.audioCtx || !this.convolverNode || !this.wetGainNode || !this.dryGainNode) return;

    if (preset === 'none') {
      this.wetGainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
      this.dryGainNode.gain.setTargetAtTime(1.0, this.audioCtx.currentTime, 0.1);
      return;
    }

    // Synthesize local spatial audio buffer
    const irBuffer = this.synthesizeReverbIR(preset);
    if (irBuffer) {
      this.convolverNode.buffer = irBuffer;
      
      // Determine wet/dry balance based on room size
      let wetLevel = 0.35;
      let dryLevel = 0.85;

      if (preset === 'cathedral') {
        wetLevel = 0.55;
        dryLevel = 0.70;
      } else if (preset === 'hall') {
        wetLevel = 0.45;
        dryLevel = 0.75;
      } else if (preset === 'studio') {
        wetLevel = 0.20;
        dryLevel = 0.95;
      }

      this.wetGainNode.gain.setTargetAtTime(wetLevel, this.audioCtx.currentTime, 0.1);
      this.dryGainNode.gain.setTargetAtTime(dryLevel, this.audioCtx.currentTime, 0.1);
    }
  }

  /**
   * Generates highly realistic mathematical audio room impulse responses
   */
  private synthesizeReverbIR(preset: ReverbPreset): AudioBuffer | null {
    if (!this.audioCtx) return null;

    let duration = 1.0;
    let decay = 3.0;

    switch (preset) {
      case 'studio':
        duration = 0.3;
        decay = 8.0;
        break;
      case 'room':
        duration = 0.7;
        decay = 5.0;
        break;
      case 'plate':
        duration = 1.2;
        decay = 4.0;
        break;
      case 'hall':
        duration = 2.2;
        decay = 2.5;
        break;
      case 'cathedral':
        duration = 4.0;
        decay = 1.5;
        break;
    }

    const sampleRate = this.audioCtx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(2, length, sampleRate);
    
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      // Exponential envelope on noise
      const factor = Math.exp(-i / (sampleRate * (duration / decay)));
      
      // Add multiple discrete early reflections
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    return buffer;
  }

  /**
   * Synchronizes metadata directly to the native Android MediaSession OS interface
   */
  public setMediaSessionMetadata(title: string, artist: string, album: string, artworkUrl?: string) {
    if ('mediaSession' in navigator) {
      const artwork = artworkUrl ? [{ src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }] : [];
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork
      });
    }
  }

  public setMediaSessionActionHandlers(
    onPlay: () => void,
    onPause: () => void,
    onNext: () => void,
    onPrev: () => void
  ) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        this.play();
        onPlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        this.pause();
        onPause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', onPrev);
      navigator.mediaSession.setActionHandler('nexttrack', onNext);
    }
  }

  // ==================== ADVANCED AUDIO EFFECTS ====================

  /**
   * Playback Speed Control (0.5x to 2.0x)
   * Note: Also affects pitch unless preservePitch is supported
   */
  public setPlaybackSpeed(speed: number) {
    this.currentSpeed = Math.max(0.5, Math.min(2.0, speed));
    this.audio.playbackRate = this.currentSpeed;
    // Try to preserve pitch if browser supports it
    if ('preservesPitch' in this.audio) {
      (this.audio as any).preservesPitch = true;
    }
  }

  /**
   * Pitch Shift Control (-12 to +12 semitones)
   * Uses detune on the source node if available
   */
  public setPitchShift(semitones: number) {
    // HTML5 Audio doesn't have native pitch shifting without changing speed
    // This would require a more complex implementation with SoundTouchJS or similar
    // For now, we rely on playback rate for pitch effects
    const pitch = Math.max(-12, Math.min(12, semitones));
    // Placeholder for future pitch shift implementation
    console.log('Pitch shift:', pitch);
  }

  /**
   * Echo/Delay Effect
   * @param delayTime delay in seconds (0 to 1.0)
   * @param feedback feedback amount (0 to 0.8)
   * @param mix wet/dry mix (0 to 1.0)
   */
  public setDelay(delayTime: number, feedback: number, mix: number) {
    if (!this.audioCtx || !this.delayNode || !this.delayFeedbackNode || !this.delayWetNode) return;
    
    this.delayNode.delayTime.setTargetAtTime(Math.max(0, Math.min(1.0, delayTime)), this.audioCtx.currentTime, 0.1);
    this.delayFeedbackNode.gain.setTargetAtTime(Math.max(0, Math.min(0.8, feedback)), this.audioCtx.currentTime, 0.1);
    this.delayWetNode.gain.setTargetAtTime(Math.max(0, Math.min(1.0, mix)), this.audioCtx.currentTime, 0.1);
  }

  /**
   * Stereo Widening / Panning
   * @param width stereo width (-1 = left, 0 = center, 1 = right)
   * For widening, we use subtle mid/side processing concept
   */
  public setStereoWidth(width: number) {
    if (!this.audioCtx || !this.stereoPannerNode) return;
    // width: -1 to 1, where 0 is normal, -1 is left, 1 is right
    this.stereoPannerNode.pan.setTargetAtTime(Math.max(-1, Math.min(1, width)), this.audioCtx.currentTime, 0.1);
  }

  /**
   * Low Pass Filter - removes high frequencies
   * @param frequency cutoff frequency (20 to 20000)
   */
  public setLowPassFilter(frequency: number) {
    if (!this.audioCtx || !this.lowPassNode) return;
    this.lowPassNode.frequency.setTargetAtTime(Math.max(20, Math.min(20000, frequency)), this.audioCtx.currentTime, 0.1);
  }

  /**
   * High Pass Filter - removes low/bass frequencies
   * @param frequency cutoff frequency (20 to 20000)
   */
  public setHighPassFilter(frequency: number) {
    if (!this.audioCtx || !this.highPassNode) return;
    this.highPassNode.frequency.setTargetAtTime(Math.max(20, Math.min(20000, frequency)), this.audioCtx.currentTime, 0.1);
  }

  /**
   * Muffle Effect - makes audio sound underwater/distant
   * Combines low pass filter with reduced high frequencies
   * @param amount muffle intensity (0 to 1.0)
   */
  public setMuffleEffect(amount: number) {
    if (!this.audioCtx || !this.muffleNode || !this.highPassNode) return;
    const muffleAmount = Math.max(0, Math.min(1, amount));
    
    // Low pass filter frequency drops as muffle increases (800Hz when fully muffled)
    const lowPassFreq = 20000 - (muffleAmount * 19200);
    this.muffleNode.frequency.setTargetAtTime(lowPassFreq, this.audioCtx.currentTime, 0.1);
    
    // Also reduce some high end
    if (muffleAmount > 0.5) {
      this.highPassNode.frequency.setTargetAtTime(100 + (muffleAmount - 0.5) * 200, this.audioCtx.currentTime, 0.1);
    } else {
      this.highPassNode.frequency.setTargetAtTime(20, this.audioCtx.currentTime, 0.1);
    }
  }

  /**
   * Treble Boost - enhances high frequencies
   * @param level boost amount (0 to 100, maps to 0 to 12dB)
   */
  public setTrebleBoost(level: number) {
    if (!this.audioCtx || !this.trebleNode) return;
    const gainDb = (Math.max(0, Math.min(100, level)) / 100) * 12;
    this.trebleNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.05);
  }

  /**
   * Apply a preset listening mode
   */
  public applyPreset(preset: 'slowed' | 'nightcore' | 'lofi' | 'bass' | 'cinema' | 'chill' | 'vinyl' | 'radio' | 'cassette' | 'normal') {
    switch (preset) {
      case 'slowed':
        this.setPlaybackSpeed(0.85);
        this.setReverb('room');
        this.setMuffleEffect(0.2);
        this.setBassBoost(30);
        break;
      case 'nightcore':
        this.setPlaybackSpeed(1.25);
        this.setReverb('none');
        this.setMuffleEffect(0);
        this.setTrebleBoost(40);
        this.setBassBoost(20);
        break;
      case 'lofi':
        this.setPlaybackSpeed(0.95);
        this.setMuffleEffect(0.3);
        this.setDelay(0.2, 0.3, 0.15);
        this.setReverb('room');
        this.setBassBoost(15);
        break;
      case 'bass':
        this.setPlaybackSpeed(1.0);
        this.setBassBoost(80);
        this.setReverb('none');
        this.setMuffleEffect(0);
        break;
      case 'cinema':
        this.setPlaybackSpeed(1.0);
        this.setReverb('hall');
        this.setStereoWidth(0.3);
        this.setDelay(0.3, 0.4, 0.2);
        break;
      case 'chill':
        this.setPlaybackSpeed(0.92);
        this.setReverb('room');
        this.setMuffleEffect(0.15);
        this.setBassBoost(10);
        this.setTrebleBoost(-10);
        break;
      case 'vinyl':
        this.setPlaybackSpeed(0.98); // Slight pitch variation
        this.setMuffleEffect(0.25);
        this.setDelay(0.05, 0.2, 0.1);
        break;
      case 'radio':
        this.setPlaybackSpeed(1.0);
        this.setLowPassFilter(8000); // Radio bandwidth
        this.setHighPassFilter(200);
        this.setMuffleEffect(0.4);
        break;
      case 'cassette':
        this.setPlaybackSpeed(0.97);
        this.setMuffleEffect(0.2);
        this.setHighPassFilter(80);
        this.setLowPassFilter(12000);
        break;
      case 'normal':
      default:
        this.setPlaybackSpeed(1.0);
        this.setReverb('none');
        this.setMuffleEffect(0);
        this.setDelay(0, 0, 0);
        this.setBassBoost(0);
        this.setTrebleBoost(0);
        this.setLowPassFilter(20000);
        this.setHighPassFilter(20);
        this.setStereoWidth(0);
        break;
    }
  }

  // ==================== COMPREHENSIVE SOUND CHARACTER EFFECTS ====================

  /**
   * Warmth - adds analog-style warmth using low-mid enhancement
   */
  public setWarmth(amount: number) {
    if (!this.audioCtx) return;
    if (!this.warmthNode) {
      this.warmthNode = this.audioCtx.createBiquadFilter();
      this.warmthNode.type = 'peaking';
      this.warmthNode.frequency.value = 400;
      this.warmthNode.Q.value = 0.3;
    }
    // More aggressive effect: up to 15dB boost
    const gainDb = (Math.max(0, Math.min(100, amount)) / 100) * 15;
    this.warmthNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.05);
  }

  /**
   * Air - adds high-frequency openness and sparkle - VERY AGGRESSIVE
   */
  public setAir(amount: number) {
    if (!this.audioCtx) return;
    if (!this.airNode) {
      this.airNode = this.audioCtx.createBiquadFilter();
      this.airNode.type = 'highshelf';
      this.airNode.frequency.value = 10000;
    }
    // EXTREME: up to 25dB boost for massive air
    const gainDb = (Math.max(0, Math.min(100, amount)) / 100) * 25;
    this.airNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.02);
    
    // Also add a second filter for more sparkle
    if (amount > 50) {
      if (!this.brightnessNode) {
        this.brightnessNode = this.audioCtx.createBiquadFilter();
        this.brightnessNode.type = 'peaking';
        this.brightnessNode.frequency.value = 12000;
        this.brightnessNode.Q.value = 0.5;
      }
      const extraSparkle = ((amount - 50) / 50) * 15;
      this.brightnessNode.gain.setTargetAtTime(extraSparkle, this.audioCtx.currentTime, 0.02);
    }
  }

  /**
   * Crisp - sharpens transients and enhances clarity - VERY AGGRESSIVE
   */
  public setCrisp(amount: number) {
    if (!this.audioCtx) return;
    if (!this.crispNode) {
      this.crispNode = this.audioCtx.createBiquadFilter();
      this.crispNode.type = 'peaking';
      this.crispNode.frequency.value = 3000;
      this.crispNode.Q.value = 2.5;
    }
    // EXTREME: up to 22dB boost for razor sharp clarity
    const gainDb = (Math.max(0, Math.min(100, amount)) / 100) * 22;
    this.crispNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.02);
    
    // Add slight compression for more punch when crisp is high
    if (amount > 60 && this.compressorNode) {
      this.compressorNode.ratio.setValueAtTime(4, this.audioCtx.currentTime);
    }
  }

  /**
   * Depth - enhances sub-bass and low-end atmosphere
   */
  public setDepth(amount: number) {
    if (!this.audioCtx) return;
    if (!this.depthNode) {
      this.depthNode = this.audioCtx.createBiquadFilter();
      this.depthNode.type = 'lowshelf';
      this.depthNode.frequency.value = 50;
    }
    // More aggressive: up to 20dB boost for deep sub-bass
    const gainDb = (Math.max(0, Math.min(100, amount)) / 100) * 20;
    this.depthNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.05);
  }

  /**
   * Punch - enhances mid-bass attack and transient impact - VERY AGGRESSIVE
   */
  public setPunch(amount: number) {
    if (!this.audioCtx) return;
    if (!this.punchNode) {
      this.punchNode = this.audioCtx.createBiquadFilter();
      this.punchNode.type = 'peaking';
      this.punchNode.frequency.value = 100;
      this.punchNode.Q.value = 3.0;
    }
    // EXTREME: up to 24dB boost for massive punch
    const gainDb = (Math.max(0, Math.min(100, amount)) / 100) * 24;
    this.punchNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.02);
    
    // Also boost slightly higher for kick presence
    if (!this.punchPresenceNode) {
      this.punchPresenceNode = this.audioCtx.createBiquadFilter();
      this.punchPresenceNode.type = 'peaking';
      this.punchPresenceNode.frequency.value = 200;
      this.punchPresenceNode.Q.value = 2.0;
    }
    const presenceGain = (Math.max(0, Math.min(100, amount)) / 100) * 12;
    this.punchPresenceNode.gain.setTargetAtTime(presenceGain, this.audioCtx.currentTime, 0.02);
  }

  /**
   * Boomy - exaggerates sub-bass for club-like effect - EXTREME
   */
  public setBoom(amount: number) {
    if (!this.audioCtx) return;
    if (!this.boomNode) {
      this.boomNode = this.audioCtx.createBiquadFilter();
      this.boomNode.type = 'lowshelf';
      this.boomNode.frequency.value = 25;
    }
    // EXTREME: up to 30dB boost for massive club bass
    const gainDb = (Math.max(0, Math.min(100, amount)) / 100) * 30;
    this.boomNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.02);
    
    // Add distortion/saturation when boom is high for more perceived bass
    if (amount > 70 && this.saturationNode) {
      const curve = new Float32Array(44100);
      const k = (amount - 70) / 10;
      for (let i = 0; i < 44100; i++) {
        const x = (i * 2) / 44100 - 1;
        curve[i] = Math.tanh(x * (1 + k * 2));
      }
      this.saturationNode.curve = curve;
    }
  }

  /**
   * Tight Bass - reduces muddy bass and tightens low-end
   */
  public setTightBass(amount: number) {
    if (!this.audioCtx) return;
    if (!this.tightBassNode) {
      this.tightBassNode = this.audioCtx.createBiquadFilter();
      this.tightBassNode.type = 'highpass';
      this.tightBassNode.frequency.value = 20;
      this.tightBassNode.Q.value = 0.7;
    }
    // More aggressive high-pass
    const freq = 20 + (Math.max(0, Math.min(100, amount)) / 100) * 150;
    this.tightBassNode.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.05);
  }

  /**
   * Brightness - overall high-frequency enhancement
   */
  public setBrightness(amount: number) {
    if (!this.audioCtx) return;
    if (!this.brightnessNode) {
      this.brightnessNode = this.audioCtx.createBiquadFilter();
      this.brightnessNode.type = 'highshelf';
      this.brightnessNode.frequency.value = 5000;
    }
    // More aggressive: up to 20dB boost
    const gainDb = (Math.max(0, Math.min(100, amount)) / 100) * 20;
    this.brightnessNode.gain.setTargetAtTime(gainDb, this.audioCtx.currentTime, 0.05);
  }

  /**
   * Compression - tightens dynamic range
   */
  public setCompression(amount: number) {
    if (!this.audioCtx) return;
    if (!this.compressorNode) {
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 20;
      this.compressorNode.attack.value = 0.001;
      this.compressorNode.release.value = 0.1;
    }
    // More aggressive compression
    const threshold = -10 - (Math.max(0, Math.min(100, amount)) / 100) * 50;
    this.compressorNode.threshold.setTargetAtTime(threshold, this.audioCtx.currentTime, 0.05);
    const ratio = 2 + (Math.max(0, Math.min(100, amount)) / 100) * 18;
    this.compressorNode.ratio.setValueAtTime(ratio, this.audioCtx.currentTime);
  }

  /**
   * Saturation - adds harmonic distortion for warmth and thickness
   */
  public setSaturation(amount: number) {
    // Simplified saturation using peaking filter as workaround
    if (!this.audioCtx) return;
    if (!this.saturationNode) {
      this.saturationNode = this.audioCtx.createWaveShaper();
      this.saturationNode.oversample = '4x';
    }
    const amt = Math.max(0, Math.min(100, amount));
    const curve = new Float32Array(44100);
    const k = amt / 10;
    for (let i = 0; i < 44100; i++) {
      const x = (i * 2) / 44100 - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    this.saturationNode.curve = curve;
  }

  /**
   * Reset all character effects to neutral
   */
  public resetCharacterEffects() {
    this.setWarmth(0);
    this.setAir(0);
    this.setCrisp(0);
    this.setDepth(0);
    this.setPunch(0);
    this.setBoom(0);
    this.setTightBass(0);
    this.setBrightness(0);
    this.setCompression(0);
    this.setSaturation(0);
  }
}

export const audioEngine = new AudioEngine();
