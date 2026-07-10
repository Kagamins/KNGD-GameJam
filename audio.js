// Spectral Infiltrator — Tropical Isle Audio Manager v37
// Procedural Web Audio API music system: no audio files required.
// Steel-drum lead, marimba chords, warm hand-drum percussion, and gentle surf ambience.
class RetroAudioManager {
  constructor() {
    this.ctx         = null;
    this.masterGain  = null;  // SFX bus
    this.musicGain   = null;  // Music bus (separate volume control)
    this.initialized = false;
    this.alarmActive = false;
    this.alarmInterval = null;

    // Music scheduler
    this._musicTimers = [];
    this._musicRunning = false;
    this._musicStep    = 0;
    this._bpm          = 104; // relaxed island groove

    // Persisted volume values
    this._sfxVol   = parseFloat(localStorage.getItem('si_sfx_vol')   ?? '0.7');
    this._musicVol = parseFloat(localStorage.getItem('si_music_vol') ?? '0.4');
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // SFX bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._sfxVol * 0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this._musicVol * 0.18, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      this.initialized = true;
      this.startMusic();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setSFXVolume(v) {     // v in 0..1
    this._sfxVol = v;
    localStorage.setItem('si_sfx_vol', v);
    if (this.masterGain) this.masterGain.gain.setValueAtTime(v * 0.3, this.ctx.currentTime);
  }

  setMusicVolume(v) {   // v in 0..1
    this._musicVol = v;
    localStorage.setItem('si_music_vol', v);
    if (this.musicGain) this.musicGain.gain.setValueAtTime(v * 0.18, this.ctx.currentTime);
  }

  // ---- MUSIC ENGINE ----
  // Looping chiptune BGM: bass, lead melody, chord pad, percussion.
  // All procedurally generated — no files needed.
  startMusic() {
    if (!this.ctx || this._musicRunning) return;
    this._musicRunning = true;
    this._musicStep = 0;
    this._scheduleMusicStep();
    this._startSurfAmbience();
  }

  stopMusic() {
    this._musicRunning = false;
    this._musicTimers.forEach(t => clearTimeout(t));
    this._musicTimers = [];
    this._stopSurfAmbience();
  }

  // Soft, looping surf-wash noise bed underneath the music — sets the tropical mood
  // without competing with the melody.
  _startSurfAmbience() {
    if (!this.ctx || this._surfNode) return;
    const bufSize = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, this.ctx.currentTime);

    const surfGain = this.ctx.createGain();
    surfGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    // Slow swell so the "waves" gently rise and fall in volume
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.09, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.025, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(surfGain.gain);
    lfo.start();

    src.connect(filter);
    filter.connect(surfGain);
    surfGain.connect(this.musicGain);
    src.start();

    this._surfNode = src;
    this._surfLfo = lfo;
  }

  _stopSurfAmbience() {
    if (this._surfNode) {
      try { this._surfNode.stop(); } catch (e) {}
      this._surfNode = null;
    }
    if (this._surfLfo) {
      try { this._surfLfo.stop(); } catch (e) {}
      this._surfLfo = null;
    }
  }

  _scheduleMusicStep() {
    if (!this._musicRunning) return;
    const stepMs   = (60 / this._bpm / 2) * 1000;   // 1/8-note in ms
    const stepSec  = stepMs / 1000;
    const now      = this.ctx.currentTime;
    const step     = this._musicStep % 32;            // 32-step loop (4 bars)

    // ---- BASS LINE (warm triangle, upright/marimba-bass feel) ----
    // Scale: D minor pentatonic — D3, F3, G3, A3, C4
    const bassNotes = [146.83, 174.61, 196.00, 220.00, 261.63];
    const bassPattern = [0,0,2,0, 1,1,3,1, 2,2,4,2, 1,3,0,0,
                         0,0,2,0, 3,3,1,3, 2,2,4,2, 0,1,3,2];
    if (step % 2 === 0) {
      const freq = bassNotes[bassPattern[step]];
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Low-pass filter for a rounded, woody warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);

      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepSec * 1.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + stepSec * 2);
    }

    // ---- STEEL-DRUM LEAD (16-step melody) ----
    // D4, F4, G4, A4, C5, D5, rest — bell-like partials mimic a pan/steel drum
    const leadNotes = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 0];
    const leadPattern = [0,6,1,2, 3,6,2,4, 3,6,1,5, 2,6,3,0,
                         4,6,2,3, 1,6,4,2, 5,6,3,4, 1,6,0,2];
    const lfreq = leadNotes[leadPattern[step]];
    if (lfreq > 0) {
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepSec * 1.4);
      gain.connect(this.musicGain);

      // Fundamental (sine) + a soft upper partial for that ringing pan-drum timbre
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(lfreq, now);
      osc1.connect(gain);
      osc1.start(now);
      osc1.stop(now + stepSec * 1.5);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(lfreq * 2.01, now); // slightly detuned octave partial
      const gain2 = this.ctx.createGain();
      gain2.gain.setValueAtTime(0.045, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + stepSec * 0.9);
      osc2.connect(gain2);
      gain2.connect(this.musicGain);
      osc2.start(now);
      osc2.stop(now + stepSec);
    }

    // ---- MARIMBA CHORD PAD (every 8 steps = 1 bar) ----
    // Dm, F, Gm, Am chord rotation
    const chordSets = [
      [293.66, 349.23, 440.00],  // Dm
      [349.23, 440.00, 523.25],  // F
      [392.00, 466.16, 587.33],  // Gm
      [440.00, 523.25, 659.25],  // Am
    ];
    if (step % 8 === 0) {
      const chord = chordSets[(step / 8) % chordSets.length];
      chord.forEach(freq => {
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.065, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepSec * 7.8);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + stepSec * 8);
      });
    }

    // ---- HAND-DRUM PERCUSSION (conga low/high + soft shaker) ----
    // Low conga on beat 1 & 3 (steps 0, 8, 16, 24), high conga on 2 & 4 (steps 4, 12, 20, 28)
    if (step % 8 === 0) {
      // Low conga: pitched thud with a quick downward pitch bend
      const congaGain = this.ctx.createGain();
      const congaOsc  = this.ctx.createOscillator();
      congaOsc.type = 'sine';
      congaOsc.frequency.setValueAtTime(180, now);
      congaOsc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
      congaGain.gain.setValueAtTime(0.32, now);
      congaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      congaOsc.connect(congaGain);
      congaGain.connect(this.musicGain);
      congaOsc.start(now);
      congaOsc.stop(now + 0.18);
    } else if (step % 8 === 4) {
      // High conga (tumbao slap): brighter, shorter pitched thud
      const hiCongaGain = this.ctx.createGain();
      const hiCongaOsc  = this.ctx.createOscillator();
      hiCongaOsc.type = 'triangle';
      hiCongaOsc.frequency.setValueAtTime(340, now);
      hiCongaOsc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
      hiCongaGain.gain.setValueAtTime(0.22, now);
      hiCongaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      hiCongaOsc.connect(hiCongaGain);
      hiCongaGain.connect(this.musicGain);
      hiCongaOsc.start(now);
      hiCongaOsc.stop(now + 0.12);
    } else if (step % 2 === 0) {
      // Shaker: soft filtered noise brush (gentler than a hi-hat click)
      const hSize  = this.ctx.sampleRate * 0.045;
      const hBuf   = this.ctx.createBuffer(1, hSize, this.ctx.sampleRate);
      const hData  = hBuf.getChannelData(0);
      for (let i = 0; i < hSize; i++) hData[i] = Math.random() * 2 - 1;
      const hSrc   = this.ctx.createBufferSource();
      hSrc.buffer  = hBuf;
      const hFilt  = this.ctx.createBiquadFilter();
      hFilt.type   = 'bandpass';
      hFilt.frequency.setValueAtTime(6000, now);
      hFilt.Q.setValueAtTime(0.7, now);
      const hGain  = this.ctx.createGain();
      hGain.gain.setValueAtTime(0.045, now);
      hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      hSrc.connect(hFilt);
      hFilt.connect(hGain);
      hGain.connect(this.musicGain);
      hSrc.start(now);
    }

    this._musicStep++;

    const t = setTimeout(() => this._scheduleMusicStep(), stepMs);
    this._musicTimers.push(t);
    // Prune old timers to avoid memory leak
    if (this._musicTimers.length > 64) this._musicTimers.splice(0, 32);
  }

  // ---- SFX METHODS ----
  playBlaster() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playDash() {
    if (!this.ctx) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer     = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2500, this.ctx.currentTime + 0.16);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noiseNode.start();
  }

  playWarpDecoy() {
    if (!this.ctx) return;
    this.resume();
    const now  = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.linearRampToValueAtTime(1500, now + 0.25);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(310, now);
    osc2.frequency.linearRampToValueAtTime(1510, now + 0.25);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain); osc2.connect(gain);
    gain.connect(this.masterGain);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + 0.26); osc2.stop(now + 0.26);
  }

  playRankUp() {
    if (!this.ctx) return;
    this.resume();
    const now   = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.21);
    });
  }

  playLevelUp() {
    if (!this.ctx) return;
    this.resume();
    const now   = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      const duration = idx === notes.length - 1 ? 0.6 : 0.15;
      gain.gain.setValueAtTime(0.12, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + duration + 0.01);
    });
  }

  playHurt() {
    if (!this.ctx) return;
    this.resume();
    const now  = this.ctx.currentTime;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // ---- BOSS THEME STINGERS ----
  // Plays a short, faction-specific motif whenever a colored Admiral boss appears,
  // and briefly ducks the background music so it cuts through.
  playBossTheme(colorCode) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Duck the music bed for ~2.6s so the stinger has room to breathe
    if (this.musicGain) {
      const musicBase = this._musicVol * 0.18;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(musicBase, now);
      this.musicGain.gain.linearRampToValueAtTime(musicBase * 0.35, now + 0.15);
      this.musicGain.gain.linearRampToValueAtTime(musicBase, now + 2.6);
    }

    if (colorCode === 'R') {
      // RED — aggressive marching brass stabs over low war-drum hits
      const notes = [220.00, 196.00, 174.61, 130.81];
      notes.forEach((freq, i) => {
        const t = now + i * 0.11;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
      });
      [0, 0.22, 0.44].forEach(offset => {
        const t = now + offset;
        const dOsc = this.ctx.createOscillator();
        const dGain = this.ctx.createGain();
        dOsc.type = 'sine';
        dOsc.frequency.setValueAtTime(140, t);
        dOsc.frequency.exponentialRampToValueAtTime(45, t + 0.14);
        dGain.gain.setValueAtTime(0.3, t);
        dGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        dOsc.connect(dGain);
        dGain.connect(this.masterGain);
        dOsc.start(t);
        dOsc.stop(t + 0.24);
      });
    } else if (colorCode === 'G') {
      // GREEN — slithering venomous glissando with a tremolo wobble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.6);
      osc.frequency.linearRampToValueAtTime(130, now + 1.3);
      osc.frequency.linearRampToValueAtTime(196, now + 2.0);

      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(9, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.09, now);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.15);
      gain.gain.linearRampToValueAtTime(0.001, now + 2.4);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 2.4);
      osc.stop(now + 2.4);
    } else {
      // BLUE — cold glassy bell tones with a rolling echo
      const notes = [587.33, 440.00, 523.25, 392.00];
      notes.forEach((freq, i) => {
        const t = now + i * 0.32;
        for (let echo = 0; echo < 3; echo++) {
          const et = t + echo * 0.16;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, et);
          const vol = 0.14 * Math.pow(0.55, echo);
          gain.gain.setValueAtTime(vol, et);
          gain.gain.exponentialRampToValueAtTime(0.001, et + 0.7);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(et);
          osc.stop(et + 0.75);
        }
      });
    }
  }

  
  playWinTheme() {
    if (!this.ctx) return;
    this.stopMusic(); // Clear BGM
    const now = this.ctx.currentTime;

    // A triumphant ascending arpeggio
    const notes = [293.66, 392.00, 587.33, 783.99, 1174.66];
    notes.forEach((freq, i) => {
      const t = now + (i * 0.2);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  playFailTheme() {
    if (!this.ctx) return;
    this.stopMusic(); // Clear BGM
    const now = this.ctx.currentTime;

    // A melancholic, dissonant descending slide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(110, now + 1.5);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 2.1);
  }

  setSirenActive(active) {
    if (!this.ctx) return;
    if (active) {
      if (this.alarmInterval) return;
      this.alarmInterval = setInterval(() => {
        if (!this.ctx) return;
        const now  = this.ctx.currentTime;
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.36);
      }, 500);
    } else {
      if (this.alarmInterval) {
        clearInterval(this.alarmInterval);
        this.alarmInterval = null;
      }
    }
  }

  stopAll() {
    this.stopMusic();
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    this.initialized = false;
  }
}

window.AudioController = new RetroAudioManager();
