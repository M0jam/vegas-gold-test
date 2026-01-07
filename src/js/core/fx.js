/**
 * VISUAL EFFECTS MANAGER
 * Handles global visual feedback like screen shakes, flashes, and big win celebrations.
 */
const FX = {
  // CONFIG
  shakeActive: false,
  
  init() {
    // Create FX Overlay layer if not exists
    if(!document.getElementById('fx-overlay')) {
      const ov = document.createElement('div');
      ov.id = 'fx-overlay';
      ov.style.position = 'fixed';
      ov.style.top = '0';
      ov.style.left = '0';
      ov.style.width = '100%';
      ov.style.height = '100%';
      ov.style.pointerEvents = 'none';
      ov.style.zIndex = '9999';
      document.body.appendChild(ov);
    }
  },

  /**
   * Shakes an element (or the whole screen if el is null)
   * @param {HTMLElement} el - Element to shake
   * @param {number} intensity - Pixels to shake
   * @param {number} duration - ms
   */
  shake(el = null, intensity = 10, duration = 500) {
    const target = el || document.body;
    const start = Date.now();
    const originalTransform = target.style.transform;
    
    // If already shaking, just update intensity/duration? 
    // For now, simple overwrite
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - start;
      
      if(elapsed >= duration) {
        target.style.transform = originalTransform;
        return;
      }
      
      // Dampen intensity over time
      const currentIntensity = intensity * (1 - elapsed/duration);
      const x = (Math.random() - 0.5) * currentIntensity * 2;
      const y = (Math.random() - 0.5) * currentIntensity * 2;
      
      // Preserve existing transform (like translate for centering) if possible
      // This is a simplified version, ideally we parse the matrix
      target.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
      
      requestAnimationFrame(animate);
    };
    
    animate();
  },

  /**
   * Flash the screen with a color
   * @param {string} color - CSS color
   * @param {number} duration - ms
   */
  flash(color = 'white', duration = 300) {
    const overlay = document.getElementById('fx-overlay');
    if(!overlay) return;
    
    overlay.style.backgroundColor = color;
    overlay.style.transition = 'none';
    overlay.style.opacity = '0.8';
    
    // Force reflow
    overlay.offsetHeight;
    
    overlay.style.transition = `opacity ${duration}ms ease-out`;
    overlay.style.opacity = '0';
  },

  /**
   * Spawn confetti/particles at coordinates
   */
  burst(x, y, count = 20, color = 'gold') {
    if(window.Particles) {
      // Use existing particle system
      // We might need to extend Particles to accept color/count overrides better
      // For now, we use the spawnExplosion method which is hardcoded, 
      // so let's update Particles.js next to be more flexible.
      Particles.spawnExplosion(x, y, count, color);
    }
  },

  /**
   * Cinematic Big Win Presentation
   */
  bigWin(amount) {
    const overlay = document.getElementById('big-win');
    const valEl = document.getElementById('win-overlay-val');
    
    // Fallback if static overlay is missing (though it should be there)
    if(!overlay || !valEl) {
        console.warn("Big Win overlay missing");
        return;
    }
    
    // Activate Overlay
    overlay.classList.add('active');
    valEl.textContent = 'V$0';
    
    // Animate Count Up
    let current = 0;
    // Calculate step to finish in approx 2 seconds
    const step = Math.max(1, amount / 120); 
    
    const interval = setInterval(() => {
      current += step;
      if(current >= amount) {
        current = amount;
        clearInterval(interval);
        
        // Final burst
        this.flash('#ffd700', 500);
        this.shake(null, 20, 1000);
        
        // Note: Overlay stays open until user clicks COLLECT
      }
      valEl.textContent = 'V$' + Math.floor(current);
      
      // Shake text
      valEl.style.transform = `scale(${1 + Math.random()*0.1})`;
    }, 16);
    
    // Audio
    if(window.AudioEngine) AudioEngine.dramaticWin();
  }
};

FX.init();
