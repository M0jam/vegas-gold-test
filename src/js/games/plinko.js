/**
 * PLINKO
 */
const Plinko = {
  cvs: null,
  ctx: null,
  pegs: [],
  balls: [],
  rows: 8,
  boardCanvas: null,
  
  init() {
    this.cvs = document.getElementById('plinko-canvas');
    if(!this.cvs) return;
    this.ctx = this.cvs.getContext('2d');
    
    this.setupBoard();
    
    // Pre-render board
    this.boardCanvas = document.createElement('canvas');
    this.boardCanvas.width = this.cvs.width;
    this.boardCanvas.height = this.cvs.height;
    this.renderStaticBoard(this.boardCanvas.getContext('2d'));
    
    this.loop();
    document.getElementById('plinko-drop').onclick = () => this.drop();
  },
  
  setupBoard() {
    this.pegs = [];
    const w = this.cvs.width;
    const h = this.cvs.height;
    const spacing = 50;
    const startY = 100;
    
    for(let r=0; r<this.rows; r++) {
      for(let c=0; c<=r; c++) {
        const x = (w/2) - (r * spacing / 2) + (c * spacing);
        const y = startY + (r * spacing);
        this.pegs.push({x, y, r: 4});
      }
    }
  },

  renderStaticBoard(ctx) {
    const mults = [0, 5, 2, 0.5, 0.2, 0.5, 2, 5, 0];
    const zoneW = 600 / mults.length;
    
    // Draw Zones
    mults.forEach((m, i) => {
        const x = i * zoneW;
        let color = 'rgba(212, 175, 55, 0.1)';
        let borderColor = '#D4AF37';
        let glowColor = '#D4AF37';
        
        if(m >= 5) { color = 'rgba(255, 68, 68, 0.2)'; borderColor='#ff4444'; glowColor='#ff0000'; }
        else if(m >= 2) { color = 'rgba(212, 175, 55, 0.3)'; borderColor='#FFD700'; glowColor='#FFD700'; }
        else if(m === 0) { color = 'rgba(20, 20, 20, 0.5)'; borderColor='#333'; glowColor='#000'; } 
        else if(m < 1) { color = 'rgba(255, 255, 255, 0.05)'; borderColor='#aaa'; glowColor='#fff'; }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, 460, zoneW, 40);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 460, zoneW, 40);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        ctx.font = '900 14px "Cinzel", serif';
        ctx.textAlign = 'center';
        ctx.fillText(m === 0 ? 'LOSE' : m + 'x', x + zoneW/2, 485);
    });
    
    // Draw Pegs (Glowing)
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#FFD700';
    ctx.fillStyle = '#fff';
    this.pegs.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  },
  
  drop() {
    const bet = parseInt(document.getElementById('plinko-bet').value);
    if(app.data.balance < bet) { app.toast("No funds"); return; }
    app.addBalance(-bet);
    
    // Daily Challenge Hooks
    if(window.Daily) {
        Daily.onEvent('play', 'plinko', 1);
        Daily.onEvent('bet', 'plinko', bet);
        Daily.onEvent('bet', 'any', bet);
    }
    
    // Perk: Plinko Guide (Better control)
    const guide = app.hasPerk('plinko_guide');
    
    this.balls.push({
      x: this.cvs.width/2 + (Math.random()-0.5)*(guide ? 2 : 20), // Tighter drop if guided
      y: 50,
      vx: 0,
      vy: 0,
      r: 10, // Larger coin
      angle: 0,
      vAngle: (Math.random()-0.5)*0.2,
      bet: bet,
      active: true,
      guide: guide
    });
  },
  
  loop() {
    // Optimization: Skip rendering if not active
    const el = document.getElementById('plinko');
    if(!el || !el.classList.contains('active')) {
        setTimeout(() => requestAnimationFrame(() => this.loop()), 500);
        return;
    }

    this.ctx.clearRect(0,0,600,500);
    // Draw pre-rendered board
    if(this.boardCanvas) this.ctx.drawImage(this.boardCanvas, 0, 0);
    
    const time = performance.now() * 0.005;
    
    // Multipliers (9 zones for 8 rows)
    const mults = [0, 5, 2, 0.5, 0.2, 0.5, 2, 5, 0];
    const zoneW = 600 / mults.length;
    
    // Physics
    this.balls.forEach(b => {
      if(!b.active) return;
      b.vy += 0.2; 
      b.x += b.vx;
      b.y += b.vy;
      b.angle += b.vAngle;
      
      // Peg Collision
      this.pegs.forEach(p => {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < b.r + p.r) {
          AudioEngine.coinSound();
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy) * 0.6;
          
          // Guide reduces chaos
          const chaos = b.guide ? 0.2 : 1.0;
          b.vx = Math.cos(angle) * speed + (Math.random()-0.5) * chaos;
          b.vy = Math.sin(angle) * speed;
          b.y += Math.sin(angle) * (b.r + p.r - dist);
        }
      });
      
      // Draw Coin
      this.drawCoin(b);
      
      // Floor
      if(b.y > 460) {
        b.active = false;
        const col = Math.floor(b.x / zoneW);
        // If out of bounds completely
        if(col < 0 || col >= mults.length) {
            app.toast("Ball fell out of bounds!", "Loss");
            return;
        }
        
        const m = mults[col];
        const win = Math.floor(b.bet * m);
        
        if(win > 0) {
          // Hot Streak
          if(m > 1) {
              const sMult = HotStreak.getMultiplier();
              let bonus = 0;
              if(sMult > 1) {
                  bonus = Math.floor(win * sMult) - win;
                  app.toast(`Hot Streak Bonus! ${sMult}x`, "Bonus");
              }
              HotStreak.win();
              app.addBalance(win + bonus);
          } else if(m < 1) {
              HotStreak.loss();
              app.addBalance(win);
          } else {
              app.addBalance(win); // Push
          }

          app.toast(`Plinko Win: V$${win}`);
          AudioEngine.winSound();
          
          if(window.Daily) {
              Daily.onEvent('win_big', 'plinko', win + (bonus||0));
              Daily.onEvent('win_big', 'any', win + (bonus||0));
          }
        } else {
            HotStreak.loss();
            app.toast(`Plinko: No win (${m}x)`);
        }
      }
    });
    
    requestAnimationFrame(() => this.loop());
  },

  drawCoin(b) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    
    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
    
    // Gold Coin Body
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI*2);
    ctx.fillStyle = '#fffbe3';
    ctx.fill();
    
    // Rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();
    
    // Inner Ring
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 0.7, 0, Math.PI*2);
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Text
    ctx.fillStyle = '#DAA520';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V$', 0, 1);
    
    ctx.restore();
  }
};
Plinko.init();
