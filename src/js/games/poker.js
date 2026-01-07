/**
 * POKER GAME (Simplified Texas Hold'em)
 */
const Poker = {
    deck: [],
    playerHand: [],
    communityCards: [],
    pot: 0,
    active: false,
    stage: 'preflop', // preflop, flop, turn, river, showdown
    
    init() {
        this.active = false;
        this.updateUI();
    },
    
    startGame() {
        if(this.active) return;
        this.reset();
    },
    
    createDeck() {
        const suits = ['♠', '♥', '♣', '♦'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.deck = [];
        for (let s of suits) {
            for (let v of values) {
                let color = (s === '♥' || s === '♦') ? 'red' : 'black';
                this.deck.push({ s, v, color });
            }
        }
        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },
    
    reset() {
        this.active = true;
        this.pot = 0;
        this.stage = 'preflop';
        this.createDeck();
        this.playerHand = [this.deck.pop(), this.deck.pop()];
        this.communityCards = [];
        // Ante
        const ante = 50;
        if(app.data.balance >= ante) {
            app.removeBalance(ante);
            this.pot = ante * 2; // Simulate opponent matching
            app.toast("Ante paid: V$50");
            if(window.Daily) {
                Daily.onEvent('bet', 'poker', ante);
                Daily.onEvent('bet', 'any', ante);
            }
        } else {
            app.toast("Insufficient funds for Ante");
            this.active = false;
        }
        this.updateUI();
    },
    
    updateUI() {
        if(!this.active) return;
        
        document.getElementById('poker-pot').textContent = this.pot.toLocaleString();
        
        // Render Player Hand
        const handEl = document.getElementById('poker-hand');
        handEl.innerHTML = '';
        this.playerHand.forEach(c => {
            handEl.innerHTML += this.renderCard(c);
        });
        
        // Render Community Cards
        const commEl = document.getElementById('poker-community');
        commEl.innerHTML = '';
        this.communityCards.forEach(c => {
            commEl.innerHTML += this.renderCard(c);
        });
        // Fill empty spots
        for(let i=this.communityCards.length; i<5; i++) {
            commEl.innerHTML += `
            <div class="bj-card" style="width:60px; height:84px; margin:0 5px;">
                <div class="bj-card-inner" style="transform: rotateY(180deg);">
                    <div class="bj-card-front"></div>
                    <div class="bj-card-back"></div>
                </div>
            </div>`;
        }
        
        document.getElementById('poker-status').textContent = this.stage.toUpperCase();
        
        // Toggle Controls
        if(this.active) {
            document.getElementById('poker-start-controls').style.display = 'none';
            document.getElementById('poker-controls').style.display = 'flex';
        } else {
            document.getElementById('poker-start-controls').style.display = 'flex';
            document.getElementById('poker-controls').style.display = 'none';
        }
    },
    
    renderCard(c) {
        // Reuse bj-card styles but scaled down
        const suitClass = c.color === 'red' ? 'suit-red' : 'suit-black';
        return `
        <div class="bj-card" style="width:60px; height:84px; margin:0 5px;">
            <div class="bj-card-inner" style="transform: rotateY(0deg);">
                <div class="bj-card-front ${suitClass}" style="background: #fff; display:flex; flex-direction:column; justify-content:center; align-items:center; border-radius:4px;">
                    <div style="font-size:20px; font-weight:bold;">${c.v}</div>
                    <div style="font-size:24px;">${c.s}</div>
                </div>
                <div class="bj-card-back"></div>
            </div>
        </div>`;
    },
    
    nextStage() {
        if(this.stage === 'preflop') {
            this.stage = 'flop';
            this.communityCards.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
        } else if(this.stage === 'flop') {
            this.stage = 'turn';
            this.communityCards.push(this.deck.pop());
        } else if(this.stage === 'turn') {
            this.stage = 'river';
            this.communityCards.push(this.deck.pop());
        } else if(this.stage === 'river') {
            this.showdown();
            return;
        }
        this.updateUI();
    },
    
    call() {
        if(!this.active) { this.reset(); return; }
        const bet = 100;
        if(app.data.balance < bet) {
            app.toast("Insufficient funds");
            return;
        }
        app.removeBalance(bet);
        this.pot += bet * 2; // Opponent matches
        AudioEngine.chipSound();
        
        if(window.Daily) {
            Daily.onEvent('bet', 'poker', bet);
            Daily.onEvent('bet', 'any', bet);
        }
        
        this.nextStage();
    },
    
    raise() {
        if(!this.active) { this.reset(); return; }
        const bet = 200; // Raise 100 on top of call
        if(app.data.balance < bet) {
            app.toast("Insufficient funds");
            return;
        }
        app.removeBalance(bet);
        this.pot += bet * 2;
        AudioEngine.chipSound();
        
        if(window.Daily) {
            Daily.onEvent('bet', 'poker', bet);
            Daily.onEvent('bet', 'any', bet);
        }

        this.nextStage();
    },
    
    fold() {
        if(!this.active) return;
        app.toast("Folded. Pot lost.");
        this.reset();
    },
    
    showdown() {
        this.stage = 'showdown';
        this.updateUI();
        
        // Simple random win for now (50/50) + slight bias for high cards
        let winChance = 0.5;
        const hasAce = this.playerHand.some(c => c.v === 'A');
        const hasPair = this.playerHand[0].v === this.playerHand[1].v;
        if(hasAce) winChance += 0.1;
        if(hasPair) winChance += 0.2;
        
        const win = Math.random() < winChance;
        
        setTimeout(() => {
            if(win) {
                app.addBalance(this.pot);
                app.toast(`You Won V$${this.pot}!`, "Poker");
                app.playWin();
                
                if(window.Daily) {
                    Daily.onEvent('win', 'poker', 1);
                    Daily.onEvent('win_big', 'poker', this.pot);
                    Daily.onEvent('win_big', 'any', this.pot);
                }
            } else {
                app.toast("Opponent Won.", "Poker");
            }
            setTimeout(() => this.reset(), 3000);
        }, 1000);
    }
};
Poker.init();
