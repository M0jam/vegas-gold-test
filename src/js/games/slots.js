/**
 * SLOTS GAME - REDESIGNED
 */
const Slots = {
  icons: ['7', 'diamond', 'crown', 'bell', 'bar', 'cherry'],
  weights: [25, 30, 35, 40, 45, 60], 
  payouts: { '7': 500, 'diamond': 200, 'crown': 100, 'bell': 50, 'bar': 25, 'cherry': 10 },
  spinning: false,
  autoSpin: false,
  
  init() {
    this.reels = [document.getElementById('reel-0'), document.getElementById('reel-1'), document.getElementById('reel-2')];
    if(!this.reels[0]) return;
    this.reels.forEach(r => this.fillReel(r));
    const spinBtn = document.getElementById('spin-btn');
    if(spinBtn) spinBtn.onclick = () => this.spin();
    const autoBtn = document.getElementById('auto-spin-btn');
    if(autoBtn) autoBtn.onclick = () => this.toggleAuto();
  },

  toggleAuto() {
    this.autoSpin = !this.autoSpin;
    const btn = document.getElementById('auto-spin-btn');
    if(this.autoSpin) {
      btn.classList.add('active');
      btn.textContent = "AUTO ON";
      if(!this.spinning) this.spin();
    } else {
      btn.classList.remove('active');
      btn.textContent = "AUTO OFF";
    }
  },
  
  fillReel(el) {
    let html = '';
    for(let i=0; i<30; i++) {
      const ico = this.icons[Math.floor(Math.random()*this.icons.length)];
      html += `<div class="symbol-box"><i class="fas fa-${this.getIconClass(ico)} slot-icon"></i></div>`;
    }
    el.innerHTML = html;
  },

  getIconClass(name) {
      const map = {
          '7': 'dice', // Using dice as placeholder for 7 if no 7 icon
          'diamond': 'gem',
          'crown': 'crown',
          'bell': 'bell',
          'bar': 'pause', // Using pause as bar
          'cherry': 'apple-alt' 
      };
      return map[name] || 'star';
  },

  getWeightedSymbol() {
    const total = this.weights.reduce((a,b) => a+b, 0);
    let r = Math.random() * total;
    for(let i=0; i<this.weights.length; i++) {
      if(r < this.weights[i]) return this.icons[i];
      r -= this.weights[i];
    }
    return this.icons[this.icons.length-1];
  },

  async spin() {
    if(this.spinning) return;
    const bet = parseInt(document.getElementById('slot-bet').value);
    
    if(app.data.balance < bet) {
      // Safety check removed
    }
    
    // Reset UI
    document.getElementById('slot-win-line').classList.remove('active');
    document.querySelector('.slot-machine-modern').classList.remove('win-glow');
    
    // Initial Shake
    if(window.FX) FX.shake(document.querySelector('.slot-machine-modern'), 2, 200);
    
    app.addBalance(-bet);
    if(bet >= 500) app.unlockAch('high_roller');
    
    // Hooks
    if(window.Daily) {
        Daily.onEvent('bet', 'slots', bet);
        Daily.onEvent('spin', 'slots', 1);
        Daily.onEvent('bet', 'any', bet);
    }
    
    this.spinning = true;
    document.getElementById('spin-btn').disabled = true;
    
    // Determine Result
    let result = [this.getWeightedSymbol(), this.getWeightedSymbol(), this.getWeightedSymbol()];
    
    // Perks
    let isWin = result[0] === result[1] && result[1] === result[2];
    if(!isWin && app.hasPerk('lucky_charm') && Math.random() < 0.2) {
      const winSym = Math.random() < 0.5 ? 'cherry' : 'bar'; 
      result = [winSym, winSym, winSym];
      isWin = true;
      app.toast("Lucky Charm triggered!", "Bonus");
    }

    let refund = false;
    if(!isWin && app.hasPerk('refund_ins') && Math.random() < 0.1) {
      refund = true;
    }
    
    // Check Near Miss
    const isNearMiss = (result[0] === result[1]) && !isWin;
    
    // Animate
    // Pass near miss flag to delay the 3rd reel
    await Promise.all(this.reels.map((el, i) => this.animateReel(el, result[i], i, isNearMiss)));
    
    // Check Win
    if(isWin) {
      const mult = this.payouts[result[0]];
      let win = bet * mult;
      
      const sMult = HotStreak.getMultiplier();
      if(sMult > 1) {
          win = Math.floor(win * sMult);
          app.toast(`Hot Streak Bonus! ${sMult}x`, "Bonus");
      }
      HotStreak.win();
      
      app.addBalance(win);
      document.getElementById('last-win').textContent = 'V$' + win;
      app.unlockAch('first_win');
      if(win >= 1000) app.unlockAch('big_winner');
      
      if(window.Daily) {
          Daily.onEvent('win', 'slots', win);
          Daily.onEvent('win_big', 'slots', win);
          Daily.onEvent('win_big', 'any', win);
      }
      
      // VISUALS
      document.getElementById('slot-win-line').classList.add('active');
      document.querySelector('.slot-machine-modern').classList.add('win-glow');
      
      if(win >= bet * 10) {
          // Big Win Cinematic
          if(window.FX) FX.bigWin(win);
          if(window.FX) FX.burst(window.innerWidth/2, window.innerHeight/2, 100);
      } else {
          // Standard Win
          AudioEngine.winSound();
          const ov = document.getElementById('big-win');
          if (ov) {
              document.getElementById('win-overlay-val').textContent = 'V$' + win;
              ov.classList.add('active');
              setTimeout(() => ov.classList.remove('active'), 2000);
          }
          if(window.FX) FX.burst(window.innerWidth/2, window.innerHeight/2, 30);
      }
      
    } else {
      HotStreak.loss();
      document.getElementById('last-win').textContent = 'V$0';
      if(refund) {
        app.addBalance(bet);
        app.toast("Refund Insurance Saved You!", "Perk");
      }
    }
    
    app.data.spins++;
    app.addXP(10);
    
    this.spinning = false;
    document.getElementById('spin-btn').disabled = false;
    
    if(this.autoSpin) {
      setTimeout(() => this.spin(), 1000);
    }
  },
  
  animateReel(el, targetIcon, idx, isNearMiss) {
    return new Promise(resolve => {
      let dur = 1000 + (idx * 500);
      
      // If near miss and this is the last reel, extend duration
      if(idx === 2 && isNearMiss) {
          dur += 1500;
          if(AudioEngine.startTension) AudioEngine.startTension();
      }

      // Visual Blur
      el.style.filter = 'blur(2px)';
      el.style.transition = `transform ${dur}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
      el.style.transform = `translateY(-2000px)`; 
      
      const iv = setInterval(() => AudioEngine.spinSound(), 100);
      
      setTimeout(() => {
        clearInterval(iv);
        AudioEngine.stopSound();
        if(idx === 2 && isNearMiss && AudioEngine.stopTension) AudioEngine.stopTension();
        
        el.style.transition = 'none';
        el.style.filter = 'none';
        el.style.transform = 'translateY(0)';
        
        // Insert target at top
        const d = document.createElement('div');
        d.className = 'symbol-box';
        // d.innerHTML = `<svg class="slot-icon"><use href="#icon-${targetIcon}"/></svg>`;
        d.innerHTML = `<i class="fas fa-${this.getIconClass(targetIcon)} slot-icon"></i>`;
        if(targetIcon === '7') d.innerHTML = `<span class="slot-icon" style="font-weight:900; font-family:'Cinzel';">7</span>`;
        
        el.prepend(d);
        if(el.children.length > 30) el.lastElementChild.remove();
        
        // Impact Effect
        if(window.FX) FX.shake(el, 5, 150);
        AudioEngine.playTone(100, 'square', 0.1, 0.1); // Clunk
        
        // Add subtle bounce
        el.animate([
          { transform: 'translateY(0)' },
          { transform: 'translateY(-20px)' },
          { transform: 'translateY(0)' }
        ], { duration: 200 });
        
        resolve();
      }, dur);
    });
  }
};
Slots.init();
