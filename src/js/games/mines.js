/**
 * MINES GAME
 */
const Mines = {
    grid: [],
    minesCount: 3,
    bet: 10,
    active: false,
    gemsFound: 0,
    currentMult: 1.0,
    mineLocations: [],
    history: [],
    
    init() {
        this.renderGrid();
        this.updateUI();
        this.updateHistoryUI();
    },

    setBet(val) {
        if(this.active) return;
        if(val === 'max') val = app.data.balance;
        this.bet = Math.min(Math.max(10, parseInt(val)), app.data.balance);
        document.getElementById('mines-bet').value = this.bet;
    },

    start() {
        if(this.active) return;
        this.bet = parseInt(document.getElementById('mines-bet').value);
        this.minesCount = parseInt(document.getElementById('mines-count').value);
        
        if(this.bet > app.data.balance) { app.toast("Insufficient funds", "Mines"); return; }
        if(this.bet < 10) { app.toast("Min bet is V$10", "Mines"); return; }

        app.addBalance(-this.bet);
        
        if(window.Daily) {
            Daily.onEvent('bet', 'mines', this.bet);
            Daily.onEvent('bet', 'any', this.bet);
        }

        this.active = true;
        this.gemsFound = 0;
        this.currentMult = 1.0;
        this.mineLocations = this.generateMines();
        this.renderGrid(); // Reset grid
        this.updateUI();
    },

    generateMines() {
        let locs = [];
        while(locs.length < this.minesCount) {
            let r = Math.floor(Math.random() * 25);
            if(!locs.includes(r)) locs.push(r);
        }
        return locs;
    },

    clickTile(idx) {
        if(!this.active) return;
        const tile = document.getElementById(`mine-tile-${idx}`);
        if(tile.classList.contains('revealed')) return;

        tile.classList.add('revealed');

        if(this.mineLocations.includes(idx)) {
            // Hit Mine
            tile.classList.add('boom');
            tile.innerHTML = '<i class="fas fa-bomb"></i>';
            this.gameOver(false);
        } else {
            // Hit Gem
            tile.classList.add('gem');
            tile.innerHTML = '<i class="fas fa-gem"></i>';
            this.gemsFound++;
            this.calculateMultiplier();
            this.updateUI();
            
            if(this.gemsFound === 25 - this.minesCount) {
                this.cashout(); // Auto win all
            }
        }
    },

    calculateMultiplier() {
        // Simple multiplier logic based on probability
        // n = 25, x = mines, k = gems found
        // Prob = (25-x)/25 * (24-x)/24 ...
        // Mult = 0.99 / Prob
        
        let prob = 1;
        for(let i=0; i<this.gemsFound; i++) {
            prob *= (25 - this.minesCount - i) / (25 - i);
        }
        this.currentMult = 1 / prob; 
        // Apply house edge
        this.currentMult = this.currentMult * 0.95; 
    },

    cashout() {
        if(!this.active) return;
        let win = Math.floor(this.bet * this.currentMult);
        
        // History
        this.history.unshift(this.currentMult);
        if(this.history.length > 4) this.history.pop();
        this.updateHistoryUI();

        // Hot Streak
        const mult = HotStreak.getMultiplier();
        if(mult > 1) {
            win = Math.floor(win * mult);
            app.toast(`Hot Streak Bonus! ${mult}x`, "Bonus");
        }
        HotStreak.win();

        app.addBalance(win);
        app.toast(`Cashed out V$${win.toLocaleString()}`, "Mines");
        
        if(window.FX) {
            FX.burst(window.innerWidth/2, window.innerHeight/2, 50, '#ffd700');
            if(this.currentMult > 5) FX.bigWin(win);
        }
        AudioEngine.winSound();
        
        if(window.Daily) {
            Daily.onEvent('win', 'mines', 1);
            Daily.onEvent('win_big', 'mines', win);
            Daily.onEvent('win_big', 'any', win);
        }

        this.gameOver(true);
    },

    gameOver(win) {
        this.active = false;
        if(!win) HotStreak.loss();
        
        // Reveal all
        for(let i=0; i<25; i++) {
            const tile = document.getElementById(`mine-tile-${i}`);
            if(!tile.classList.contains('revealed')) {
                tile.classList.add('revealed');
                tile.style.opacity = '0.5';
                if(this.mineLocations.includes(i)) {
                    tile.innerHTML = `<i class="fas fa-bomb" style="font-size:24px;"></i>`;
                } else {
                    tile.innerHTML = `<i class="fas fa-gem" style="font-size:24px;"></i>`;
                }
            }
        }
        this.updateUI();
    },

    updateUI() {
        const startBtn = document.getElementById('mines-start-btn');
        const cashoutBtn = document.getElementById('mines-cashout-btn');
        const nextMult = document.getElementById('mines-next-mult');
        const cashoutVal = document.getElementById('mines-cashout-val');
        const balance = document.getElementById('mines-balance');
        const inputs = [document.getElementById('mines-bet'), document.getElementById('mines-count')];

        balance.textContent = app.data.balance.toLocaleString();

        if(this.active) {
            startBtn.style.display = 'none';
            cashoutBtn.style.display = 'block';
            inputs.forEach(i => i.disabled = true);
            
            const currentWin = Math.floor(this.bet * this.currentMult);
            cashoutVal.textContent = `V$ ${currentWin.toLocaleString()}`;
            
            // Calc next mult
            let prob = 1;
            for(let i=0; i<=this.gemsFound; i++) { // +1 gem
                prob *= (25 - this.minesCount - i) / (25 - i);
            }
            let nextM = (1/prob) * 0.95;
            nextMult.textContent = nextM.toFixed(2) + 'x';

        } else {
            startBtn.style.display = 'block';
            cashoutBtn.style.display = 'none';
            inputs.forEach(i => i.disabled = false);
            nextMult.textContent = "1.00x";
        }
    },

    updateHistoryUI() {
        const container = document.getElementById('mines-history');
        if(!container) return;
        
        if(!this.history || this.history.length === 0) {
            container.innerHTML = '<div class="mines-history-empty">No cashouts yet</div>';
            return;
        }
        
        container.innerHTML = '';
        this.history.forEach(mult => {
            const div = document.createElement('div');
            div.className = `mines-history-pill ${mult >= 2 ? 'win' : 'loss'}`;
            div.textContent = mult.toFixed(2) + 'x';
            container.appendChild(div);
        });
    },

    renderGrid() {
        const grid = document.getElementById('mines-grid');
        grid.innerHTML = '';
        for(let i=0; i<25; i++) {
            const btn = document.createElement('div');
            btn.id = `mine-tile-${i}`;
            btn.className = 'mine-tile';
            btn.onclick = () => this.clickTile(i);
            grid.appendChild(btn);
        }
    }
};
