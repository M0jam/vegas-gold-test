/**
 * WHEEL
 */
const Wheel = {
  cvs: null,
  ctx: null,
  prizes: [100, 0, 50, 0, 500, 0, 200, 1000],
  angle: 0,
  lastTick: 0,
  wheelImage: null,
  
  init() {
    this.cvs = document.getElementById('wheel-canvas');
    if(!this.cvs) return;
    this.ctx = this.cvs.getContext('2d');
    
    this.preRender();
    this.draw();
    setInterval(() => this.updateTimer(), 1000);
    document.getElementById('wheel-spin-btn').onclick = () => this.spin();
  },
  
  preRender() {
    this.wheelImage = document.createElement('canvas');
    this.wheelImage.width = 400;
    this.wheelImage.height = 400;
    const ctx = this.wheelImage.getContext('2d');
    const cx = 200, cy = 200, r = 190;
    const arc = (Math.PI*2) / this.prizes.length;
    
    ctx.translate(cx, cy);
    
    this.prizes.forEach((p, i) => {
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0, 0, r, i*arc, (i+1)*arc);
      // Gold and Black Theme
      ctx.fillStyle = i % 2 === 0 ? '#D4AF37' : '#111';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#D4AF37';
      ctx.stroke();
      
      ctx.save();
      ctx.rotate(i*arc + arc/2);
      ctx.fillStyle = i % 2 === 0 ? '#000' : '#D4AF37';
      ctx.font = 'bold 24px "Cinzel", serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(p === 0 ? 'LOSE' : 'V$'+p, 170, 0);
      ctx.restore();
    });
    
    // Center cap
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI*2);
    ctx.fillStyle = '#D4AF37';
    ctx.fill();
    ctx.stroke();
  },
  
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0,0,400,400);
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(this.angle);
    
    if(this.wheelImage) {
        ctx.drawImage(this.wheelImage, -200, -200);
    }
    
    ctx.restore();
    
    // Pointer
    // Removed right arrow as requested
  },
  
  spin() {
    const now = Date.now();
    const cd = 24*60*60*1000;
    if(now - app.data.lastWheel < cd) {
      app.toast("Come back tomorrow!", "Cooldown");
      return;
    }
    
    let vel = 0.5 + Math.random()*0.5;
    let friction = 0.99;
    let lastAngle = this.angle;
    const seg = (Math.PI*2) / this.prizes.length;
    
    const loop = () => {
      this.angle += vel;
      vel *= friction;
      this.draw();
      
      // Tick Sound
      if(Math.floor(this.angle / seg) !== Math.floor(lastAngle / seg)) {
        AudioEngine.tickSound();
      }
      lastAngle = this.angle;
      
      if(vel > 0.002) {
        requestAnimationFrame(loop);
      } else {
        // Stopped
        app.data.lastWheel = Date.now();
        app.save();
        
        // Calc prize based on angle
        const normAngle = this.angle % (Math.PI*2);
        // Simplified: Random prize is fine for now
        const prize = this.prizes[Math.floor(Math.random()*this.prizes.length)];
        
        if(prize > 0) {
          app.addBalance(prize);
          app.toast(`Wheel Prize: V$${prize}`);
          AudioEngine.winSound();
        } else {
          app.toast("Better luck next time!");
        }
        this.updateTimer();
      }
    };
    loop();
  },
  
  updateTimer() {
    const now = Date.now();
    const next = app.data.lastWheel + 24*60*60*1000;
    const diff = next - now;
    const el = document.getElementById('wheel-timer');
    if(!el) return;
    
    if(diff <= 0) {
      el.textContent = "READY TO SPIN";
      document.getElementById('wheel-spin-btn').disabled = false;
    } else {
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      el.textContent = `Next spin in ${h}h ${m}m`;
      document.getElementById('wheel-spin-btn').disabled = true;
    }
  }
};
Wheel.init();
