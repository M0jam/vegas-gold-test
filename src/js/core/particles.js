/**
 * PARTICLES (Golden Sparkles & High-Res Bills)
 */
const Particles = {
  list: [],
  cvs: null,
  ctx: null,
  w: 0, 
  h: 0,
  billCvs: null,
  frameCount: 0,

  init() {
    this.cvs = document.getElementById('bg-canvas');
    if(!this.cvs) return;
    this.ctx = this.cvs.getContext('2d');
    
    const resize = () => { 
        this.w = this.cvs.width = window.innerWidth; 
        this.h = this.cvs.height = window.innerHeight; 
    };
    window.onresize = resize;
    resize();
    
    // Pre-render High-Quality Golden Bill
    this.billCvs = document.createElement('canvas');
    this.billCvs.width = 120; // Higher res
    this.billCvs.height = 60;
    const bCtx = this.billCvs.getContext('2d');
    
    // Rich Gold Gradient
    const grad = bCtx.createLinearGradient(0, 0, 120, 60);
    grad.addColorStop(0, '#d4af37');   // Dark Gold
    grad.addColorStop(0.3, '#ffd700'); // Bright Gold
    grad.addColorStop(0.5, '#fffbe3'); // Shine
    grad.addColorStop(0.7, '#ffd700'); // Bright Gold
    grad.addColorStop(1, '#b8860b');   // Darker Gold
    
    bCtx.fillStyle = grad;
    
    // Rounded Rect path
    const r = 4;
    bCtx.beginPath();
    bCtx.moveTo(r, 0);
    bCtx.lineTo(120-r, 0);
    bCtx.quadraticCurveTo(120, 0, 120, r);
    bCtx.lineTo(120, 60-r);
    bCtx.quadraticCurveTo(120, 60, 120-r, 60);
    bCtx.lineTo(r, 60);
    bCtx.quadraticCurveTo(0, 60, 0, 60-r);
    bCtx.lineTo(0, r);
    bCtx.quadraticCurveTo(0, 0, r, 0);
    bCtx.fill();
    
    // Inner Border
    bCtx.strokeStyle = 'rgba(255,255,255,0.6)';
    bCtx.lineWidth = 2;
    bCtx.strokeRect(4, 4, 112, 52);
    
    // Text
    bCtx.fillStyle = 'rgba(0,50,0,0.7)'; // Dark Green ink
    bCtx.font = '900 32px "Cinzel"';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText('$100', 60, 30);
    
    // Corner details
    bCtx.font = 'bold 10px sans-serif';
    bCtx.fillText('100', 10, 12);
    bCtx.fillText('100', 110, 50);

    // Initialize pool - Increased count for "Luxury" feel
    for(let i=0; i<80; i++) this.createParticle(Math.random() * this.h);
    
    this.loop();
  },

  createParticle(yOverride) {
      const isBill = Math.random() > 0.3; // 70% chance of bill
      let p;
      if(isBill) {
          p = {
              type: 'bill',
              x: Math.random() * this.w,
              y: yOverride !== undefined ? yOverride : -100,
              w: 80 + Math.random() * 40, // Varied size
              h: 40 + Math.random() * 20,
              vy: 2.0 + Math.random() * 3.0, // Faster falling speed for "rain" feel
              vr: (Math.random() - 0.5) * 0.05, // Faster rotation
              angle: Math.random() * Math.PI * 2,
              sway: Math.random() * Math.PI,
              swaySpeed: 0.02 + Math.random() * 0.03,
              depth: Math.random() // For "volumetric" layering feel
          };
      } else {
          p = {
              type: 'sparkle',
              x: Math.random() * this.w,
              y: yOverride !== undefined ? yOverride : Math.random() * this.h,
              size: 1 + Math.random() * 3,
              vy: 0.2 + Math.random() * 0.8,
              alpha: Math.random(),
              fadeSpeed: 0.002 + Math.random() * 0.005
          };
      }
      this.list.push(p);
  },

  spawnExplosion(x, y, count=40, colorOverride=null) {
      for(let i=0; i<count; i++) {
          this.list.push({
              type: 'explosion',
              x: x,
              y: y,
              vx: (Math.random() - 0.5) * 15, // Higher velocity
              vy: (Math.random() - 0.5) * 15,
              size: 3 + Math.random() * 8,
              alpha: 1,
              decay: 0.01 + Math.random() * 0.02,
              color: colorOverride ? colorOverride : (Math.random() > 0.5 ? '#ffd700' : '#fff')
          });
      }
  },

  loop() {
      if(document.hidden) {
          setTimeout(() => requestAnimationFrame(() => this.loop()), 500);
          return;
      }

      // TARGET 60FPS - No frame skipping for smoothness
      this.frameCount++;
      
      this.ctx.clearRect(0,0,this.w,this.h);
      
      // Simulate volumetric lighting zones (Headlights)
      // Left headlight: x < 25% width
      // Right headlight: x > 75% width
      const lightLeft = this.w * 0.3;
      const lightRight = this.w * 0.7;

      for(let i = this.list.length - 1; i >= 0; i--) {
        let p = this.list[i];
        
        if(p.type === 'explosion') {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.alpha -= p.decay;
            
            if(p.alpha <= 0) {
                this.list.splice(i, 1);
                continue;
            }
            
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
            continue;
        }

        p.y += p.vy;
        
        if(p.type === 'bill') {
            p.angle += p.vr;
            p.sway += p.swaySpeed;
            p.x += Math.sin(p.sway) * 1.0;
            
            if(p.y > this.h + 100) {
                this.list.splice(i, 1);
                this.createParticle(-100);
                continue;
            }
            
            // Interaction with Headlights
            let brightness = 0;
            if(p.x < lightLeft) {
                brightness = 1 - (p.x / lightLeft); // 0 to 1
            } else if (p.x > lightRight) {
                brightness = (p.x - lightRight) / (this.w - lightRight); // 0 to 1
            }
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);
            
            // Draw Bill
            this.ctx.drawImage(this.billCvs, -p.w/2, -p.h/2, p.w, p.h);
            
            // Add "Glint" if in headlight
            if(brightness > 0.2) {
                this.ctx.globalCompositeOperation = 'overlay';
                this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
                this.ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            }
            
            this.ctx.restore();
        } else {
            // Sparkles
            p.alpha -= p.fadeSpeed;
            if(p.alpha <= 0 || p.y > this.h) {
                this.list.splice(i, 1);
                this.createParticle(-10);
                continue;
            }
            
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
      }
      
      // Maintain density
      while(this.list.length < 100) {
          this.createParticle(-10);
      }
      
      requestAnimationFrame(() => this.loop());
  }
};

const CasesFX = {
  active: false,
  canvas: null,
  ctx: null,
  parts: [],
  start() {
    this.canvas = document.getElementById('case-fx');
    if(!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    this.ctx = this.canvas.getContext('2d');
    this.parts = [];
    for(let i=0;i<40;i++){
      this.parts.push({
        x: Math.random()*this.canvas.width,
        y: Math.random()*this.canvas.height,
        z: Math.random()*300 + 100,
        vx: (Math.random()-0.5)*0.6,
        vy: (Math.random()-0.5)*0.4,
        vz: (Math.random()-0.5)*2,
        c: i%3===0?'#ffd700':(i%3===1?'#9b59b6':'#2ecc71')
      });
    }
    this.active = true;
    this.loop();
  },
  stop() {
    this.active = false;
    if(this.ctx) {
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
  },
  loop() {
    if(!this.active || !this.ctx) return;
    const w = this.canvas.width, h = this.canvas.height;
    this.ctx.clearRect(0,0,w,h);
    this.ctx.save();
    this.ctx.globalAlpha = 0.9;
    this.parts.forEach(p=>{
      p.x += p.vx; p.y += p.vy; p.z += p.vz;
      if(p.z < 80 || p.z > 420) p.vz *= -1;
      if(p.x < 0) p.x = w; if(p.x > w) p.x = 0;
      if(p.y < 0) p.y = h; if(p.y > h) p.y = 0;
      const f = 300/(p.z+300);
      const sx = p.x, sy = p.y;
      const size = 6*f*devicePixelRatio;
      this.ctx.fillStyle = p.c;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy - size);
      this.ctx.lineTo(sx - size, sy + size);
      this.ctx.lineTo(sx + size, sy + size);
      this.ctx.closePath();
      this.ctx.fill();
    });
    this.ctx.restore();
    requestAnimationFrame(()=>this.loop());
  }
};
