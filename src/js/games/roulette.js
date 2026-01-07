/**
 * ROULETTE GAME
 */
const Roulette = {
    wheel: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    colors: {
        0: 'green',
        // Red numbers: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
        1: 'red', 3: 'red', 5: 'red', 7: 'red', 9: 'red', 12: 'red', 14: 'red', 16: 'red', 18: 'red', 19: 'red', 21: 'red', 23: 'red', 25: 'red', 27: 'red', 30: 'red', 32: 'red', 34: 'red', 36: 'red'
        // Others are black
    },
    spinning: false,
    
    init() {
        this.updateUI();
    },
    
    getColor(n) {
        if(n === 0) return 'green';
        return this.colors[n] || 'black';
    },
    
    bet(type) {
        if(this.spinning) return;
        const amountInput = document.getElementById('roulette-bet-amount');
        const amount = parseInt(amountInput.value);
        
        if(isNaN(amount) || amount <= 0) {
            app.toast("Invalid bet amount");
            return;
        }
        if(app.data.balance < amount) {
            app.toast("Insufficient funds");
            return;
        }
        
        app.removeBalance(amount);
        
        if(window.Daily) {
            Daily.onEvent('bet', 'roulette', amount);
            Daily.onEvent('play', 'roulette', 1);
            Daily.onEvent('bet', 'any', amount);
        }
        
        this.spin(type, amount);
    },
    
    spin(betType, betAmount) {
        this.spinning = true;
        const wheelEl = document.getElementById('roulette-wheel-visual');
        const resultEl = document.getElementById('roulette-result');
        const msgEl = document.getElementById('roulette-msg');
        
        msgEl.textContent = "Spinning...";
        AudioEngine.wooshSound();
        
        // Visual Spin
        const randomRot = 720 + Math.random() * 720; // At least 2 spins
        wheelEl.style.transform = `rotate(${randomRot}deg)`;
        
        // Animation Logic
        setTimeout(() => {
            const r = Math.floor(Math.random() * 37);
            resultEl.textContent = r;
            resultEl.style.transform = `rotate(-${randomRot}deg)`; // Counter-rotate text so it stays upright
            resultEl.style.color = this.getColor(r) === 'red' ? '#ff4444' : (this.getColor(r) === 'green' ? '#00cc00' : '#fff');
            
            this.resolve(betType, betAmount, r);
        }, 3000); // 3s spin match transition
    },
    
    resolve(betType, betAmount, result) {
        this.spinning = false;
        const color = this.getColor(result);
        const msgEl = document.getElementById('roulette-msg');
        const wheelEl = document.getElementById('roulette-wheel-visual');
        
        // Reset rotation for next spin (optional, or keep it accumulating)
        // wheelEl.style.transition = 'none';
        // wheelEl.style.transform = 'rotate(0deg)';
        
        let win = false;
        let payout = 0;
        
        if(betType === 'red' && color === 'red') {
            win = true;
            payout = betAmount * 2;
        } else if (betType === 'black' && color === 'black') {
            win = true;
            payout = betAmount * 2;
        } else if (betType === 'green' && color === 'green') {
            win = true;
            payout = betAmount * 14;
        }
        
        if(win) {
            app.addBalance(payout);
            msgEl.textContent = `WIN! +V$${payout}`;
            msgEl.style.color = "var(--success)";
            app.playWin();
        } else {
            msgEl.textContent = `LOST V$${betAmount}`;
            msgEl.style.color = "var(--danger)";
        }
    },
    
    updateUI() {
        // Nothing special to init
    }
};
Roulette.init();
