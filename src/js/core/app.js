/**
 * GAME APP CONTROLLER
 */
const app = {
  user: null,
  data: {
    balance: 1000,
    xp: 0,
    level: 1,
    spins: 0,
    lastWheel: 0,
    achievements: [],
    inventory: [], // Store bought item IDs
    settings: { vol: 30, theme: 'royal' },
    friends: [],
    profileCode: null,
    lastDaily: null,
    dailyProgress: 0,
    popupsSeen: []
  },
  achievementsList: [
    { id: 'first_win', title: 'First Blood', desc: 'Win your first game', icon: '★' },
    { id: 'high_roller', title: 'High Roller', desc: 'Bet V$500 in one go', icon: '♛' },
    { id: 'level_5', title: 'Rising Star', desc: 'Reach Level 5', icon: '♜' },
    { id: 'big_winner', title: 'Jackpot', desc: 'Win over V$1000 in one spin', icon: '♦' }
  ],

  enterGame(mode = 'guest') {
    document.getElementById('loader').classList.add('walk-in-active');
    
    // Optimized transition for immediate feedback
    // Reduced delays for snappier feel
    const delay = mode === 'auth' ? 200 : 400;

    // Pre-navigate behind the curtain
    if (mode === 'auth') {
        this.nav('login');
        // Ensure auth mode is toggled to login form
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('auth-title').textContent = "Access Royal Club";
    } else {
        this.nav('home');
    }
    
    setTimeout(() => {
        const loader = document.getElementById('loader');
        // Faster smooth scale-out fade effect
        loader.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-in';
        loader.style.opacity = '0';
        loader.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            loader.style.display = 'none';
        }, 400);
        
        AudioEngine.wooshSound();
    }, delay); // Wait for walk-in animation
    AudioEngine.startMusic();
  },

  filterGames(category, btn) {
      // 1. Update Buttons
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 2. Filter Tiles
      const tiles = document.querySelectorAll('.game-tile');
      tiles.forEach(tile => {
          const cat = tile.getAttribute('data-category');
          if (category === 'all' || cat === category) {
              tile.style.display = 'flex';
              // Add simple fade-in animation
              tile.style.opacity = '0';
              tile.style.transform = 'translateY(10px)';
              setTimeout(() => {
                  tile.style.transition = 'all 0.3s ease-out';
                  tile.style.opacity = '1';
                  tile.style.transform = 'translateY(0)';
              }, 50);
          } else {
              tile.style.display = 'none';
          }
      });
  },

  init() {
    // Auth System Init
    if(window.AuthSystem) AuthSystem.init();

    // Content System Init
    if(window.ContentSystem) ContentSystem.init();
    
    // Check for session
    if(window.AuthSystem) {
        const session = AuthSystem.checkSession();
        if(session) {
            this.user = { email: session.email, name: session.name };
            this.load();
            this.toast('Welcome back, ' + this.user.name);
        }
    } else {
        this.load(); // Legacy fallback
    }

    // Start with blank slate, don't nav to home yet until entered
    this.updateUI();
    this.renderAchievements();
    
    // Init Modules
    if(window.Mines) Mines.init();
    if(window.Shop) Shop.init();
    if(window.Inventory) Inventory.init();
    if(window.Market) Market.init();
    if(window.Particles) Particles.init();
    if(window.Social) Social.init();
    if(window.Changelog) Changelog.init();
    if(window.Roadmap) Roadmap.init();
    if(window.Daily) Daily.check();
    if(window.ProfileSystem) ProfileSystem.init();
    if(window.Cosmetics) Cosmetics.init();

    this.startJackpotTicker();
    
    // Check daily & UI
    this.check();
    
    this.animateIntro();
    
    // Bind Settings
    const vol = document.getElementById('vol-slider');
    if(vol) {
        vol.value = this.data.settings.vol;
        AudioEngine.masterVol = vol.value / 100;
        vol.oninput = (e) => {
          this.data.settings.vol = e.target.value;
          AudioEngine.masterVol = e.target.value / 100;
          if(AudioEngine.musicEl) AudioEngine.musicEl.volume = AudioEngine.masterVol;
          this.save();
        };
    }
    
    const musicBtn = document.getElementById('music-toggle');
    if(musicBtn) {
        musicBtn.onclick = (e) => {
          const playing = AudioEngine.toggleMusic();
          e.target.textContent = playing ? "Turn Off Music" : "Turn On Music";
          e.target.classList.toggle('secondary', !playing);
        };
    }
  },

  animateIntro() {
      // 1. Staggered reveal of text/logo
      const elements = document.querySelectorAll('.intro-element');
      elements.forEach((el, idx) => {
          setTimeout(() => {
              el.classList.add('visible');
          }, 100 * (idx + 1));
      });

      // 2. Set Version
      const vTag = document.getElementById('version-display');
      if(vTag && window.Changelog && Changelog.entries.length > 0) {
          vTag.innerHTML = `<span>v${Changelog.entries[0].version}</span>`;
      } else if (vTag) {
          vTag.innerHTML = `<span>v1.0.0</span>`; // Fallback
      }

      // 3. Spawn Intro Particles (JS driven for randomness)
      const container = document.getElementById('intro-particles');
      if(container) {
          const spawnParticle = () => {
              if(!document.getElementById('loader') || document.getElementById('loader').style.display === 'none') return;
              
              const p = document.createElement('div');
              p.className = 'intro-particle';
              p.style.left = Math.random() * 100 + '%';
              p.style.width = p.style.height = (Math.random() * 3 + 2) + 'px';
              p.style.animationDuration = (Math.random() * 3 + 4) + 's'; // 4-7s float
              p.style.opacity = Math.random() * 0.5 + 0.2;
              container.appendChild(p);
              
              // Cleanup
              p.addEventListener('animationend', () => p.remove());
          };

          // Initial burst
          for(let i=0; i<15; i++) {
              setTimeout(spawnParticle, Math.random() * 2000);
          }
          
          // Continuous loop until game entered
          const interval = setInterval(() => {
              if(!document.getElementById('loader') || document.getElementById('loader').style.display === 'none') {
                  clearInterval(interval);
                  return;
              }
              spawnParticle();
          }, 800);
      }
  },

  startJackpotTicker() {
    const el = document.getElementById('jackpot-display');
    if(!el) return;
    
    // Parse initial value (remove commas)
    let value = parseInt(el.textContent.replace(/,/g, ''));
    
    setInterval(() => {
        // Random increment between 50 and 200
        const inc = Math.floor(Math.random() * 150) + 50;
        value += inc;
        el.textContent = value.toLocaleString();
    }, 3000); // Update every 3 seconds
  },

  load() {
    // Legacy support for old session format
    const s = localStorage.getItem('vg_session');
    if(s && !this.user) {
      this.user = JSON.parse(s);
    }
    
    // Load user data if user exists (from AuthSystem or Legacy)
    if(this.user) {
      const d = localStorage.getItem('vg_data_' + this.user.email);
      if(d) this.data = { ...this.data, ...JSON.parse(d) };
    }
  },

  save() {
    if(this.user) {
      localStorage.setItem('vg_data_' + this.user.email, JSON.stringify(this.data));
    }
  },

  closeGameInfo() {
      if (document.getElementById('game-info-check').checked) {
          this.data.popupsSeen.push(this.pendingGame);
          this.save();
      }
      document.getElementById('game-info-modal').classList.remove('active');
      this.nav(this.pendingGame, true); // Force nav
  },

  toggleAccordion(header) {
      const item = header.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all accordions in the same container
      const container = item.parentElement;
      if(container) {
          container.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('active'));
      }
      
      // If it wasn't active, open it
      if (!isActive) {
          item.classList.add('active');
      }
  },

  nav(id, force = false) {
    // Game Popups
    const games = {
      'slots': { title: 'Royal Slots', desc: 'Spin the reels and match symbols to win big! Look out for 777s for the jackpot.' },
      'plinko': { title: 'Golden Plinko', desc: 'Drop the ball and watch it bounce to multipliers. High risk, high reward!' },
      'wheel': { title: 'Daily Wheel', desc: 'Spin the wheel every 24 hours for free credits. No risk, just rewards.' },
      'blackjack': { title: 'Blackjack', desc: 'Beat the dealer by getting closer to 21 without going over. Blackjack pays 3:2.' },
      'mines': { title: 'Royal Mines', desc: 'Uncover diamonds on the grid. Avoid the hidden mines to multiply your bet. Cash out anytime!' },
      'poker': { title: 'Vegas Poker', desc: 'Texas Hold\'em. Bluff your way to victory or hold the winning hand.' },
      'roulette': { title: 'Royal Roulette', desc: 'Spin the wheel! Red, Black, or Green. High stakes, instant wins.' }
    };
    
    if (!force && games[id] && (!this.data.popupsSeen || !this.data.popupsSeen.includes(id))) {
      this.pendingGame = id;
      if(!this.data.popupsSeen) this.data.popupsSeen = [];
      document.getElementById('game-info-title').textContent = games[id].title;
      document.getElementById('game-info-desc').textContent = games[id].desc;
      document.getElementById('game-info-check').checked = false;
      document.getElementById('game-info-modal').classList.add('active');
      return;
    }

    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.game-section').forEach(el => el.style.display = 'none');
    
    if (id === 'blackjack') {
        document.getElementById('blackjack').classList.add('active');
        if(window.Blackjack) Blackjack.init();
    } else if (id === 'mines') {
        document.getElementById('mines').classList.add('active');
        if(window.Mines) Mines.init();
    } else if (id === 'market') {
        document.getElementById('market').classList.add('active');
        if(window.Market) Market.render();
    } else {
        const el = document.getElementById(id);
        if(el) el.classList.add('active');
    }
    
    // Handle auth UI visibility
    const auth = !!this.user;
    const authUi = document.getElementById('auth-ui');
    const guestUi = document.getElementById('guest-ui');
    if(authUi) authUi.classList.toggle('hidden', !auth);
    if(guestUi) guestUi.classList.toggle('hidden', auth);
  },



  async login() {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    const remember = document.getElementById('auth-remember') ? document.getElementById('auth-remember').checked : false;

    if(!email) {
        this.toast("Please enter email");
        return;
    }

    // Check if 2FA code is visible and entered
    const codeGroup = document.getElementById('auth-2fa-group');
    const codeInput = document.getElementById('auth-2fa-code');
    const code = codeInput ? codeInput.value.trim() : '';

    let result;
    if (codeGroup && codeGroup.style.display !== 'none' && code.length === 6) {
         // Verify 2FA
         result = await AuthSystem.verify2FA(email, code, remember);
    } else {
         // Normal Login
         if(!pass) {
             this.toast("Please enter password");
             return;
         }
         result = await AuthSystem.login(email, pass, remember);
    }
    
    if(result.success) {
      this.user = result.user;
      this.load(); // Reload data for this user
      this.nav('home');
      this.updateUI();
      this.toast('Welcome back, ' + this.user.name);
      document.getElementById('auth-pass').value = '';
      
      // Reset 2FA UI
      if(codeInput) {
          codeInput.value = '';
          codeGroup.style.display = 'none';
      }
    } else if (result.requires2FA) {
        // Show 2FA Input
        if(codeGroup) {
            codeGroup.style.display = 'block';
            document.getElementById('auth-msg').textContent = "Enter 2FA Code from Google Authenticator";
            document.getElementById('auth-msg').style.color = "var(--gold-2)";
        } else {
            // Should not happen if index.html is correct, but fallback
             const code = prompt("Enter 2FA Code:");
             if(code) {
                 const res2 = await AuthSystem.verify2FA(email, code, remember);
                 if(res2.success) {
                     this.user = res2.user;
                     this.load();
                     this.nav('home');
                     this.updateUI();
                     this.toast('Welcome back!');
                     return;
                 }
             }
             this.toast("2FA Failed");
        }
    } else {
        document.getElementById('auth-msg').textContent = result.error;
        document.getElementById('auth-msg').style.color = "var(--danger)";
    }
  },

  logout() {
    AuthSystem.logout();
  },

  toggleAuthMode() {
    const log = document.getElementById('login-form');
    const reg = document.getElementById('register-form');
    const title = document.getElementById('auth-title');
    
    if(log.classList.contains('hidden')) {
      log.classList.remove('hidden');
      reg.classList.add('hidden');
      title.textContent = "Access Royal Club";
    } else {
      log.classList.add('hidden');
      reg.classList.remove('hidden');
      title.textContent = "Join Royal Club";
    }
  },

  async register() { 
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    
    if(!name || !email || !pass) {
      document.getElementById('auth-msg').textContent = "Please fill all fields";
      document.getElementById('auth-msg').style.color = "var(--danger)";
      return;
    }
    
    // Auth System Register
    const result = await AuthSystem.register(email, pass, name);
    if(!result.success) {
        document.getElementById('auth-msg').textContent = result.error;
        document.getElementById('auth-msg').style.color = "var(--danger)";
        return;
    }

    // Auto Login
    await AuthSystem.login(email, pass, false);
    this.user = { email, name };
    
    // Init data
    this.data = { balance: 2000, xp: 0, level: 1, spins: 0, lastWheel: 0, achievements: [], inventory: [], settings: {vol:30, theme:'royal'} };
    this.save();
    
    // Email Confirmation System (FormSubmit)
    // NOTE: Replace 'YOUR_ADMIN_EMAIL@example.com' with your actual email address
    // and confirm it on FormSubmit to enable auto-responses to users.
    const adminEmail = "vegas.gold@gmx.de"; 
    
    fetch(`https://formsubmit.co/ajax/${adminEmail}`, {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            _subject: "Welcome to Vegas Gold!",
            _autoresponse: "Thank you for joining Vegas Gold! Your account has been successfully created. Enjoy your V$2000 welcome bonus!",
            _template: "table",
            name: name,
            email: email, // FormSubmit sends auto-response to this address
            message: "New user registration confirmed."
        })
    })
    .then(response => response.json())
    .then(data => console.log('Email sent:', data))
    .catch(error => console.warn('Email system warning:', error));

    this.nav('home');
    this.updateUI();
    this.toast(`Welcome, ${name}! Confirmation email sent.`);
  },

  recoverAccount() {
      const email = prompt("Enter your email address to recover your account:");
      if(email) {
          if(AuthSystem.recover(email)) {
              this.toast("Recovery email sent (Simulated)");
          } else {
              this.toast("Email not found");
          }
      }
  },

  hasPerk(id) {
    return this.data.inventory && this.data.inventory.includes(id);
  },

  animateValue(id, end, duration = 1000) {
      const obj = document.getElementById(id);
      if(!obj) return;
      
      // Clean current text (remove non-digits)
      const currentText = obj.textContent.replace(/[^0-9]/g, '');
      const start = parseInt(currentText) || 0;
      
      if(start === end) return;
      
      let startTimestamp = null;
      const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          // Ease out expo
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          
          const val = Math.floor(ease * (end - start) + start);
          obj.textContent = val;
          
          if (progress < 1) {
              window.requestAnimationFrame(step);
          } else {
              obj.textContent = end;
          }
      };
      window.requestAnimationFrame(step);
  },

  updateUI() {
    // Animated update for main balance
    this.animateValue('balance-disp', this.data.balance);
    this.animateValue('gems-disp', this.data.gems || 0);

    // Instant update for game headers (optional, can be animated too)
    const slotBal = document.getElementById('slot-bal-disp');
    if(slotBal) slotBal.textContent = this.data.balance;
    const plinkoBal = document.getElementById('plinko-bal-disp');
    if(plinkoBal) plinkoBal.textContent = this.data.balance;
    const bjBal = document.getElementById('bj-balance');
    if(bjBal) bjBal.textContent = this.data.balance;
    const minesBal = document.getElementById('mines-balance');
    if(minesBal) minesBal.textContent = this.data.balance;
    
    const lvlBadge = document.getElementById('lvl-badge');
    if(lvlBadge) lvlBadge.textContent = this.data.level;
    const statsLvl = document.getElementById('stats-lvl');
    if(statsLvl) statsLvl.textContent = this.data.level;
    const statsXp = document.getElementById('stats-xp');
    if(statsXp) statsXp.textContent = this.data.xp;
    const statsSpins = document.getElementById('stats-spins');
    if(statsSpins) statsSpins.textContent = this.data.spins;
    
    // XP Bar logic (Level * 1000 XP required)
    const nextLvlXp = this.data.level * 1000;
    const pct = Math.min(100, (this.data.xp / nextLvlXp) * 100);
    const xpFill = document.getElementById('xp-fill');
    if(xpFill) xpFill.style.width = pct + '%';
    
    // Enhanced XP Text
    const xpText = document.getElementById('xp-text');
    if(xpText) xpText.textContent = `${this.data.xp} / ${nextLvlXp} XP`;
  },

  addXP(amount) {
    this.data.xp += amount;
    this.spawnXPParticles(amount);
    const nextLvlXp = this.data.level * 1000;
    if(this.data.xp >= nextLvlXp) {
      this.data.level++;
      this.data.xp -= nextLvlXp;
      this.toast(`LEVEL UP! You are now level ${this.data.level}`);
      this.playWin();
      this.unlockAch('level_5');
    }
    this.save();
    this.updateUI();
  },

  spawnXPParticles(amount) {
    const container = document.getElementById('xp-particles-layer');
    const barContainer = document.getElementById('xp-bar-container');
    if(!container) return;
    
    // Pulse effect
    if(barContainer) {
        barContainer.animate([
            { boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)' },
            { boxShadow: '0 0 15px var(--gold-2), inset 0 2px 5px rgba(0,0,0,0.8)' },
            { boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)' }
        ], {
            duration: 500,
            easing: 'ease-out'
        });
    }
    
    // Number of particles based on amount, capped
    const count = Math.min(10, Math.max(3, Math.floor(amount / 10)));
    
    for(let i=0; i<count; i++) {
      const p = document.createElement('div');
      p.className = 'xp-particle';
      // Random position along the bar
      const left = Math.random() * 100;
      p.style.left = left + '%';
      p.style.bottom = '0';
      // Random delay
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      container.appendChild(p);
      
      // Remove after animation
      setTimeout(() => p.remove(), 1000);
    }
  },

  addBalance(amount) {
    this.data.balance += amount;
    this.save();
    this.updateUI();
  },

  removeBalance(amount) {
      if(this.data.balance < amount) return false;
      this.data.balance -= amount;
      this.save();
      this.updateUI();
      return true;
  },

  addGems(amount) {
      this.data.gems = (this.data.gems || 0) + amount;
      this.save();
      this.updateUI();
  },
  
  removeGems(amount) {
      if((this.data.gems || 0) < amount) return false;
      this.data.gems -= amount;
      this.save();
      this.updateUI();
      return true;
  },

  toast(msg, title="Notification") {
    const c = document.getElementById('toasts');
    if(!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="toast-title">${title}</span><span class="toast-body">${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  },

  playWin() { AudioEngine.winSound(); },
  
  unlockAch(id) {
    if(!this.data.achievements.includes(id)) {
      const ach = this.achievementsList.find(a => a.id === id);
      if(ach) {
        this.data.achievements.push(id);
        this.toast(ach.title, "Achievement Unlocked!");
        this.save();
        this.renderAchievements();
      }
    }
  },

  renderAchievements() {
    const c = document.getElementById('ach-list');
    if(!c) return;
    c.innerHTML = '';
    this.achievementsList.forEach(a => {
      const unlocked = this.data.achievements.includes(a.id);
      const div = document.createElement('div');
      div.className = `achievement-card ${unlocked ? 'unlocked' : ''}`;
      div.innerHTML = `<div class="ach-icon">${a.icon}</div><strong>${a.title}</strong><div style="font-size:12px">${a.desc}</div>`;
      c.appendChild(div);
    });
  }
};

/**
 * DAILY CHALLENGES SYSTEM
 */
const Daily = {
  // Pool of possible challenges
  pool: [
    { id: 'c1', type: 'spin', game: 'slots', target: 50, reward: 500, desc: "Spin 50 times in Slots" },
    { id: 'c2', type: 'win', game: 'blackjack', target: 5, reward: 600, desc: "Win 5 hands in Blackjack" },
    { id: 'c3', type: 'play', game: 'plinko', target: 20, reward: 400, desc: "Drop 20 balls in Plinko" },
    { id: 'c4', type: 'win', game: 'mines', target: 3, reward: 500, desc: "Win 3 games of Mines (min 3 mines)" },
    { id: 'c5', type: 'bet', game: 'any', target: 2000, reward: 1000, desc: "Wager a total of V$2000" },
    { id: 'c6', type: 'win_big', game: 'any', target: 1, reward: 800, desc: "Win V$1000+ in a single game" },
    { id: 'c7', type: 'play', game: 'roulette', target: 10, reward: 400, desc: "Play 10 rounds of Roulette" },
    { id: 'c8', type: 'win', game: 'poker', target: 3, reward: 700, desc: "Win 3 hands of Poker" }
  ],

  check() {
    // Current time in UTC to ensure global consistency
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    // Check if new day or no data or challenges missing
    if (app.data.lastDaily !== todayStr || !app.data.dailyChallenges || app.data.dailyChallenges.length === 0) {
        this.generateDailyChallenges(todayStr);
        
        // Show modal on first login of the day
        setTimeout(() => {
            const modal = document.getElementById('daily-modal');
            if(modal) modal.classList.add('active');
        }, 1000);
    }
    
    // Always render UI
    this.updateUI();
  },
  
  generateDailyChallenges(dateStr) {
    app.data.lastDaily = dateStr;
    app.data.dailyChallenges = []; // Clear old
    
    // Randomly select 1-5 challenges
    const count = Math.floor(Math.random() * 5) + 1;
    const shuffled = [...this.pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    // Init state for them
    app.data.dailyChallenges = selected.map(c => ({
        id: c.id,
        progress: 0,
        completed: false,
        claimed: false,
        ...c // Copy static data for display
    }));
    
    app.save();
    console.log(`Generated ${count} daily challenges for ${dateStr}`);
  },
  
  // Called by games to report progress
  // type: 'spin' | 'win' | 'play' | 'bet' | 'win_big'
  // game: 'slots' | 'blackjack' | ... | 'any'
  // amount: value to add (1 for count, or $ amount for bets/wins)
  onEvent(type, game, amount = 1) {
      if(!app.data.dailyChallenges) return;
      
      let changed = false;
      
      app.data.dailyChallenges.forEach(c => {
          if (c.completed) return;
          
          // Match criteria
          const typeMatch = c.type === type;
          const gameMatch = c.game === 'any' || c.game === game;
          
          if (typeMatch && gameMatch) {
              // Special case for 'win_big' - amount must exceed target (target is usually 1 count, but condition is amount > 1000)
              if (type === 'win_big') {
                  if (amount >= 1000) {
                      c.progress = 1; // Done
                  }
              } else {
                  c.progress += amount;
              }
              
              // Check completion
              if (c.progress >= c.target) {
                  c.progress = c.target;
                  c.completed = true;
                  app.toast(`Challenge Completed: ${c.desc}`, "Daily Goal");
                  app.playWin();
              }
              changed = true;
          }
      });
      
      if (changed) {
          app.save();
          this.updateUI();
      }
  },
  
  claim(index) {
      const c = app.data.dailyChallenges[index];
      if (!c || !c.completed || c.claimed) return;
      
      c.claimed = true;
      app.addBalance(c.reward);
      app.toast(`Claimed V$${c.reward}`, "Challenge Reward");
      app.save();
      this.updateUI();
  },
  
  updateUI() {
      const list = document.getElementById('daily-challenges-list');
      if(!list) return;
      
      list.innerHTML = '';
      
      const challenges = app.data.dailyChallenges || [];
      
      if (challenges.length === 0) {
          list.innerHTML = '<div style="text-align:center;color:#666">No challenges today. Check back tomorrow!</div>';
          return;
      }
      
      challenges.forEach((c, idx) => {
          const pct = Math.min(100, (c.progress / c.target) * 100);
          const isDone = c.completed;
          const isClaimed = c.claimed;
          
          const div = document.createElement('div');
          div.className = 'challenge-item';
          div.style.background = 'rgba(255,255,255,0.05)';
          div.style.padding = '15px';
          div.style.borderRadius = '8px';
          div.style.marginBottom = '10px';
          div.style.border = isDone ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.1)';
          
          let btnHtml = '';
          if (isClaimed) {
              btnHtml = `<button class="gold-btn secondary" disabled style="opacity:0.5; font-size:10px; padding:5px 10px">CLAIMED</button>`;
          } else if (isDone) {
              btnHtml = `<button class="gold-btn" onclick="Daily.claim(${idx})" style="font-size:10px; padding:5px 10px; animation: pulse-glow 1s infinite">CLAIM V$${c.reward}</button>`;
          } else {
              btnHtml = `<span style="font-size:12px; color:var(--gold-4)">Reward: V$${c.reward}</span>`;
          }
          
          div.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                  <div style="font-size:13px; color:#fff; font-weight:bold">${c.desc}</div>
                  ${btnHtml}
              </div>
              <div style="background:#000; height:6px; border-radius:3px; overflow:hidden; position:relative">
                  <div style="width:${pct}%; height:100%; background:${isDone ? 'var(--success)' : 'var(--gold-2)'}; transition:width 0.5s"></div>
              </div>
              <div style="text-align:right; font-size:10px; color:#888; margin-top:4px">${c.progress} / ${c.target}</div>
          `;
          list.appendChild(div);
      });
      
      // Update Timer
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow - now;
      
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const timerEl = document.getElementById('daily-reset-timer');
      if(timerEl) timerEl.textContent = `Reset in: ${hrs}h ${mins}m`;
  }
};

/**
 * HOT STREAK SYSTEM
 */
const HotStreak = {
    count: 0,
    
    win() {
        this.count++;
        this.checkMilestones();
        this.updateUI();
    },
    
    loss() {
        if(this.count >= 3) {
            app.toast("Streak Broken!", "Info");
        }
        this.count = 0;
        this.updateUI();
        document.body.classList.remove('hot-mode');
    },
    
    checkMilestones() {
        if(this.count === 3) {
            app.addBalance(100);
            app.toast("Heating Up! +V$100", "Hot Streak");
            try { AudioEngine.winSound(); } catch(e){}
        }
        if(this.count === 5) {
            app.addBalance(500);
            app.toast("ON FIRE! +V$500", "Hot Streak");
            document.body.classList.add('hot-mode');
            try { AudioEngine.winSound(); } catch(e){}
        }
        if(this.count === 10) {
            app.addBalance(2000);
            app.toast("GODLIKE! +V$2000", "Hot Streak");
            try { if(window.Particles) Particles.spawnExplosion(window.innerWidth/2, window.innerHeight/2); } catch(e){}
            try { AudioEngine.winSound(); } catch(e){}
        }
    },
    
    updateUI() {
        const c = document.getElementById('streak-container');
        const fill = document.getElementById('streak-fill');
        const text = document.getElementById('streak-text');
        const mult = document.getElementById('streak-mult');
        
        if(!c) return;
        
        if(this.count > 0) {
            c.classList.add('active');
        } else {
            c.classList.remove('active');
        }
        
        // Max visual streak 10
        const pct = Math.min(100, (this.count / 10) * 100);
        if(fill) fill.style.width = pct + '%';
        
        if(this.count >= 10) {
            text.textContent = "GODLIKE";
            text.style.color = "#ff0000";
            mult.textContent = "1.25x";
        } else if(this.count >= 5) {
            text.textContent = "ON FIRE";
            text.style.color = "#ff4500";
            mult.textContent = "1.10x";
        } else if(this.count >= 3) {
            text.textContent = "HEATING UP";
            text.style.color = "#ffd700";
            mult.textContent = "1.05x";
        } else {
            text.textContent = "HOT STREAK";
            text.style.color = "var(--gold-1)";
            mult.textContent = "1.0x";
        }
    },
    
    getMultiplier() {
        if(this.count >= 10) return 1.25;
        if(this.count >= 5) return 1.1;
        if(this.count >= 3) return 1.05;
        return 1.0;
    }
};

// Content System (Roadmap & Changelog) moved to src/js/core/content.js
