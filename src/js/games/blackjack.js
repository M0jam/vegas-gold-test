/**
 * BLACKJACK
 */
const Blackjack = {
    deck: [],
    dealerHand: [],
    playerHand: [],
    bet: 0,
    currentBet: 0,
    active: false,
    
    init() {
        this.currentBet = 0;
        this.updateUI();
    },
    
    createDeck() {
        const suits = ['spade', 'heart', 'club', 'diamond'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.deck = [];
        for (let s of suits) {
            for (let v of values) {
                this.deck.push({ s, v });
            }
        }
        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },
    
    getCardValue(card) {
        if (['J', 'Q', 'K'].includes(card.v)) return 10;
        if (card.v === 'A') return 11;
        return parseInt(card.v);
    },
    
    calculate(hand) {
        let score = 0;
        let aces = 0;
        for (let c of hand) {
            score += this.getCardValue(c);
            if (c.v === 'A') aces++;
        }
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    },
    
    addBet(amount) {
        if (this.active) return;
        if (app.data.balance < this.currentBet + amount) {
            app.toast("Insufficient funds", "Error");
            return;
        }
        this.currentBet += amount;
        AudioEngine.chipSound();
        this.updateUI();
    },

    clearBet() {
        if (this.active) return;
        this.currentBet = 0;
        this.updateUI();
    },

    async deal() {
        if (this.active) return;
        if (this.currentBet === 0) {
            app.toast("Place a bet first!", "Error");
            return;
        }
        
        if (app.data.balance < this.currentBet) {
             app.toast("Insufficient funds", "Error");
             return;
        }

        app.addBalance(-this.currentBet);
        this.bet = this.currentBet;
        
        // Daily Challenge Hooks
        if(window.Daily) {
            Daily.onEvent('bet', 'blackjack', this.currentBet);
            Daily.onEvent('bet', 'any', this.currentBet);
        }

        this.active = true;
        this.createDeck();
        this.playerHand = [];
        this.dealerHand = [];
        
        document.getElementById('bj-bet-controls').style.display = 'none';
        document.getElementById('bj-play-controls').style.display = 'flex';
        document.getElementById('bj-msg').style.display = 'none';
        
        // Clear board
        document.getElementById('bj-player-cards').innerHTML = '';
        document.getElementById('bj-dealer-cards').innerHTML = '';
        
        // Deal animation sequence
        await this.dealCard(this.playerHand, 'bj-player-cards', true);
        await this.dealCard(this.dealerHand, 'bj-dealer-cards', true);
        await this.dealCard(this.playerHand, 'bj-player-cards', true);
        await this.dealCard(this.dealerHand, 'bj-dealer-cards', false); // Hole card
        
        this.updateUI(false, true); // Update scores only
        
        // Check Natural Blackjack
        const pScore = this.calculate(this.playerHand);
        if (pScore === 21) {
            setTimeout(() => this.stand(), 500);
        }
    },

    dealCard(hand, containerId, faceUp) {
        return new Promise(resolve => {
            // Safety Check: Deck empty?
            if (this.deck.length === 0) this.createDeck();
            
            const card = this.deck.pop();
            if (!card) { resolve(); return; } // Should not happen after createDeck
            
            hand.push(card);
            
            const container = document.getElementById(containerId);
            if (!container) {
                console.error("Blackjack container missing:", containerId);
                resolve();
                return;
            }

            const cardEl = this.createCardElement(card);
            
            // Initial state: Face down (CSS default)
            
            container.appendChild(cardEl);
            
            // Animation
            try { AudioEngine.cardSound(); } catch(e){}
            
            if (faceUp) {
                cardEl.classList.add('deal-fly-in-up');
                // Ensure state persists after animation
                setTimeout(() => {
                    cardEl.classList.add('flipped');
                    resolve();
                }, 600);
            } else {
                cardEl.classList.add('deal-fly-in');
                setTimeout(() => {
                    resolve();
                }, 500);
            }
        });
    },
    
    async hit() {
        if (!this.active) return;
        await this.dealCard(this.playerHand, 'bj-player-cards', true);
        this.updateUI(false, true);
        
        if (this.calculate(this.playerHand) > 21) {
            setTimeout(() => this.endRound(false, "BUST!"), 500);
        }
    },
    
    async stand() {
        if (!this.active) return;
        
        // Reveal hole card
        const dealerContainer = document.getElementById('bj-dealer-cards');
        if(dealerContainer.children.length > 1) {
            dealerContainer.children[1].classList.add('flipped');
        }
        this.updateUI(true, true); // Update dealer score
        
        await new Promise(r => setTimeout(r, 600));
        
        while (this.calculate(this.dealerHand) < 17) {
            await this.dealCard(this.dealerHand, 'bj-dealer-cards', true);
            this.updateUI(true, true);
            await new Promise(r => setTimeout(r, 600));
        }
        
        const pScore = this.calculate(this.playerHand);
        const dScore = this.calculate(this.dealerHand);
        
        if (dScore > 21) {
            this.endRound(true, "DEALER BUST!");
        } else if (pScore > dScore) {
            this.endRound(true, "YOU WIN!");
        } else if (pScore === dScore) {
            this.endRound(null, "PUSH");
        } else {
            this.endRound(false, "DEALER WINS");
        }
    },
    
    endRound(win, msg) {
        this.active = false;
        let winAmount = 0;
        
        if (win === true) {
            const pScore = this.calculate(this.playerHand);
            // Blackjack pays 3:2
            if (pScore === 21 && this.playerHand.length === 2) {
                winAmount = Math.floor(this.bet * 2.5);
                msg = "BLACKJACK!";
            } else {
                winAmount = this.bet * 2;
            }
            
            // Hot Streak Bonus
            const mult = HotStreak.getMultiplier();
            if(mult > 1) {
                winAmount = Math.floor(winAmount * mult);
                app.toast(`Hot Streak Bonus! ${mult}x`, "Bonus");
            }
            HotStreak.win();
            
            app.addBalance(winAmount);
            AudioEngine.winSound();
            
            // Daily Challenge Hooks
            if(window.Daily) {
                Daily.onEvent('win', 'blackjack', 1);
                Daily.onEvent('win_big', 'blackjack', winAmount);
                Daily.onEvent('win_big', 'any', winAmount);
            }
        } else if (win === null) {
            winAmount = this.bet;
            app.addBalance(winAmount); // Return bet
        } else {
            HotStreak.loss();
        }
        
        document.getElementById('bj-result-text').textContent = msg;
        document.getElementById('bj-win-amount').textContent = winAmount > 0 ? `+ V$ ${winAmount}` : `V$ 0`;
        document.getElementById('bj-msg').style.display = 'block';
        document.getElementById('bj-play-controls').style.display = 'none';
        
        this.currentBet = 0; // Reset for next
    },
    
    reset() {
        document.getElementById('bj-msg').style.display = 'none';
        document.getElementById('bj-bet-controls').style.display = 'flex';
        this.dealerHand = [];
        this.playerHand = [];
        this.updateUI();
    },
    
    updateUI(showDealer = false, partial = false) {
        const dScore = document.getElementById('bj-dealer-score');
        const pScore = document.getElementById('bj-player-score');
        const betDisp = document.getElementById('bj-current-bet');
        
        if(betDisp) betDisp.textContent = this.currentBet;
        
        // Update Scores
        pScore.textContent = this.calculate(this.playerHand);
        
        let dealerScoreVal = 0;
        if (showDealer || !this.active) {
            dealerScoreVal = this.calculate(this.dealerHand);
            dScore.style.opacity = 1;
        } else {
            if (this.dealerHand.length > 0) {
                 dealerScoreVal = this.getCardValue(this.dealerHand[0]);
                 dScore.style.opacity = 1;
            } else {
                 dScore.style.opacity = 0;
            }
        }
        dScore.textContent = dealerScoreVal;

        document.getElementById('bj-balance').textContent = app.data.balance.toLocaleString();

        if (partial) return;

        // Full Re-render
        const pDiv = document.getElementById('bj-player-cards');
        const dDiv = document.getElementById('bj-dealer-cards');
        
        pDiv.innerHTML = '';
        this.playerHand.forEach(c => {
             const el = this.createCardElement(c);
             el.classList.add('flipped');
             pDiv.appendChild(el);
        });
        
        dDiv.innerHTML = '';
        this.dealerHand.forEach((c, i) => {
             const el = this.createCardElement(c);
             if (i === 0 || showDealer || !this.active) el.classList.add('flipped');
             // Else: Hole card stays Face Down (default CSS)
             dDiv.appendChild(el);
        });
    },
    
    renderCard(c) {
        if (!c) {
            return `<div class="bj-card"><div class="bj-card-inner"><div class="bj-card-back"></div></div></div>`;
        }
        // Legacy fallback - new logic uses createCardElement
        return this.createCardElement(c).outerHTML;
    },
    
    createCardElement(c) {
        const div = document.createElement('div');
        div.className = 'bj-card';
        const suitClass = (c.s === 'heart' || c.s === 'diamond') ? 'suit-red' : 'suit-black';
        const suitIcon = this.getSuitIcon(c.s);
        
        div.innerHTML = `
            <div class="bj-card-inner">
                <div class="bj-card-front ${suitClass}">
                    <div class="bj-card-corner top-left">
                        <div>${c.v}</div>
                        <div>${suitIcon}</div>
                    </div>
                    <div class="bj-suit-center">${suitIcon}</div>
                    <div class="bj-card-corner bottom-right">
                        <div>${c.v}</div>
                        <div>${suitIcon}</div>
                    </div>
                </div>
                <div class="bj-card-back"></div>
            </div>
        `;
        return div;
    },
    
    getSuitIcon(suit) {
        const map = {
            'heart': '♥',
            'diamond': '♦',
            'spade': '♠',
            'club': '♣'
        };
        return map[suit] || '';
    }
};
