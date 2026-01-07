/**
 * AUDIO ENGINE
 * Synthesizes sounds to avoid external dependencies.
 */
const AudioEngine = {
  ctx: new (window.AudioContext || window.webkitAudioContext)(),
  masterVol: 0.3,
  musicPlaying: false,
  musicInterval: null,
  
  init() {
    // Resume context if needed
    document.addEventListener('click', () => {
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }, {once:true});
  },
  
  startMusic() {
    if(this.ctx.state === 'suspended') this.ctx.resume();
    
    if(!this.musicEl) {
      // TODO: Replace with a valid direct MP3 link or local file (e.g., 'assets/music.mp3')
      // The previous background music link has expired.
      this.musicEl = new Audio(''); 
      this.musicEl.loop = true;
    }
    
    // Set initial volume to 0 for fade in
    this.musicEl.volume = 0;
    this.musicEl.play().catch(e => console.log("Audio play error:", e));
    this.musicPlaying = true;
    
    // Fade in to 15% (0.15) over 2 seconds
    const targetVol = 0.15;
    this.masterVol = targetVol; // Set internal master to 15%
    
    // Update slider if it exists
    const slider = document.getElementById('vol-slider');
    if(slider) slider.value = 15;
    
    let vol = 0;
    const fade = setInterval(() => {
      vol += 0.01;
      if(vol >= targetVol) {
        vol = targetVol;
        clearInterval(fade);
      }
      if(this.musicEl) this.musicEl.volume = vol;
    }, 100);
    
    // Update button state
    const btn = document.getElementById('music-toggle');
    if(btn) {
       btn.textContent = "Turn Off Music";
       btn.classList.remove('secondary');
    }
  },
  playTone(freq, type, duration, vol=0.1, fade=true) {
    if(this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gn = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gn.gain.setValueAtTime(vol * this.masterVol, t);
    if(fade) gn.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gn);
    gn.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  },

  coinSound() { 
    const now = this.ctx.currentTime;
    if(this.lastCoin && now - this.lastCoin < 0.05) return;
    this.lastCoin = now;
    // High pitched "ching"
    this.playTone(2000 + Math.random()*500, 'sine', 0.1, 0.05);
    // Metallic overtone
    this.playTone(4000 + Math.random()*1000, 'triangle', 0.05, 0.02);
  },
  winSound() { 
    // Bell-like sequence (E major arpeggio)
    [0, 0.1, 0.2].forEach((d, i) => {
        const freq = [659.25, 830.61, 987.77][i]; // E5, G#5, B5
        this.playTone(freq, 'sine', 0.8, 0.15); 
        this.playTone(freq * 2, 'triangle', 0.8, 0.05); // Harmonic
    });
  },
  spinSound() { 
    const now = this.ctx.currentTime;
    if(this.lastSpin && now - this.lastSpin < 0.06) return;
    this.lastSpin = now;
    // Mechanical click (short high freq)
    this.playTone(800, 'square', 0.03, 0.05);
    this.playTone(1200, 'sawtooth', 0.02, 0.02);
  },
  dramaticWin() {
    const t = this.ctx.currentTime;
    // Grand Fanfare - Brighter, less bassy
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C Major extended
    
    freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gn = this.ctx.createGain();
        osc.type = 'triangle'; // Smoother than sawtooth
        osc.frequency.setValueAtTime(f, t + i*0.08);
        
        gn.gain.setValueAtTime(0, t + i*0.08);
        gn.gain.linearRampToValueAtTime(0.3 * this.masterVol, t + i*0.08 + 0.05);
        gn.gain.exponentialRampToValueAtTime(0.001, t + i*0.08 + 1.5);
        
        osc.connect(gn);
        gn.connect(this.ctx.destination);
        osc.start(t + i*0.08);
        osc.stop(t + i*0.08 + 2.0);
    });

    // Sparkle effect instead of Bass Boom
    for(let k=0; k<10; k++) {
        const osc = this.ctx.createOscillator();
        const gn = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random()*2000, t + k*0.1);
        gn.gain.setValueAtTime(0.1 * this.masterVol, t + k*0.1);
        gn.gain.exponentialRampToValueAtTime(0.001, t + k*0.1 + 0.3);
        osc.connect(gn);
        gn.connect(this.ctx.destination);
        osc.start(t + k*0.1);
        osc.stop(t + k*0.1 + 0.3);
    }
  },
  
  tensionLoop: null,
  startTension() {
      if(this.tensionLoop) return;
      // Low pulsing drone
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gn = this.ctx.createGain();
      
      osc.frequency.setValueAtTime(60, t);
      // LFO for volume
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 4; // 4Hz pulse
      const lfoGn = this.ctx.createGain();
      lfoGn.gain.value = 0.05 * this.masterVol;
      
      lfo.connect(lfoGn);
      lfoGn.connect(gn.gain);
      
      osc.connect(gn);
      gn.connect(this.ctx.destination);
      osc.start();
      lfo.start();
      
      this.tensionLoop = { osc, lfo, gn, lfoGn };
  },
  
  stopTension() {
      if(this.tensionLoop) {
          const t = this.ctx.currentTime;
          this.tensionLoop.gn.gain.setTargetAtTime(0, t, 0.1);
          setTimeout(() => {
              if(this.tensionLoop) {
                  this.tensionLoop.osc.stop();
                  this.tensionLoop.lfo.stop();
                  this.tensionLoop = null;
              }
          }, 200);
      }
  },
  chipSound() { this.playTone(1500, 'sine', 0.05, 0.05); },
  cardSound() { this.playTone(600, 'triangle', 0.05, 0.05); },
  wooshSound() {
    if(this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gn = this.ctx.createGain();
    
    // Low frequency sweep for "woosh"
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);
    
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(0.3 * this.masterVol, t + 0.1);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    
    osc.connect(gn);
    gn.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  },
  tickSound() { this.playTone(800, 'sine', 0.05, 0.05); },
  stopSound() { /* No-op for now */ },

  musicEl: null,
  toggleMusic() {
    if(!this.musicEl) {
      // TODO: Replace with a valid direct MP3 link or local file
      this.musicEl = new Audio(''); 
      this.musicEl.loop = true;
    }
    
    if(this.musicPlaying) {
      this.musicEl.pause();
      this.musicPlaying = false;
      return false;
    } else {
      this.musicEl.volume = this.masterVol;
      this.musicEl.play().catch(e => console.log("Audio play error:", e));
      this.musicPlaying = true;
      return true;
    }
  }
};
