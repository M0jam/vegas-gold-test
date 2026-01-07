/**
 * SOCIAL SYSTEM
 */
const Social = {
  chatMessages: [],
  leaderboard: [],
  
  init() {
    if (!app.data.profileCode) {
        app.data.profileCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        app.save();
    }
    const codeEl = document.getElementById('my-profile-code');
    if(codeEl) codeEl.textContent = app.data.profileCode;
    
    this.renderFriends();
    
    // Seed initial chat
    this.chatMessages = [
        { user: 'System', msg: 'Welcome to Global Chat!', type: 'system' },
        { user: 'LadyLuck', msg: 'Just hit a massive win on Plinko!', type: 'user' },
        { user: 'CardShark', msg: 'Anyone up for Blackjack?', type: 'user' }
    ];
    this.renderChat();
    
    // Seed leaderboard
    this.leaderboard = [
        { name: 'CasinoKing', score: 1500000 },
        { name: 'JackpotJill', score: 1200000 },
        { name: 'HighRoller99', score: 950000 },
        { name: 'LuckyStrike', score: 800000 },
        { name: 'ChipMaster', score: 500000 }
    ];
    this.renderLeaderboard();
  },
  
  switchTab(tab) {
      ['friends', 'chat', 'leaderboard'].forEach(t => {
          document.getElementById('social-tab-' + t).style.display = (t === tab) ? 'block' : 'none';
      });
  },
  
  sendMessage() {
      const input = document.getElementById('chat-input');
      const msg = input.value.trim();
      if(!msg) return;
      
      this.chatMessages.push({ 
          user: app.user ? app.user.name : 'Guest', 
          msg: msg, 
          type: 'user',
          self: true
      });
      
      input.value = '';
      this.renderChat();
      
      // Mock reply
      if(Math.random() > 0.7) {
          setTimeout(() => {
               const bots = ['Dealer', 'PitBoss', 'VegasBot'];
               const replies = ['Nice!', 'Good luck!', 'Wow!', 'Keep it up!'];
               this.chatMessages.push({
                   user: bots[Math.floor(Math.random()*bots.length)],
                   msg: replies[Math.floor(Math.random()*replies.length)],
                   type: 'user'
               });
               this.renderChat();
          }, 2000);
      }
  },
  
  renderChat() {
      const el = document.getElementById('chat-messages');
      if(!el) return;
      el.innerHTML = '';
      this.chatMessages.slice(-20).forEach(m => {
          const div = document.createElement('div');
          div.style.padding = '5px';
          div.style.borderRadius = '4px';
          div.style.background = m.type === 'system' ? 'rgba(255,215,0,0.1)' : (m.self ? 'rgba(255,255,255,0.1)' : 'transparent');
          
          const nameColor = m.type === 'system' ? 'var(--gold-2)' : (m.self ? '#fff' : '#aaa');
          
          div.innerHTML = `
            <span style="color:${nameColor};font-weight:bold;font-size:10px">${m.user}:</span>
            <span style="color:#ddd">${m.msg}</span>
          `;
          el.appendChild(div);
      });
      el.scrollTop = el.scrollHeight;
  },
  
  renderLeaderboard() {
      const el = document.getElementById('leaderboard-list');
      if(!el) return;
      el.innerHTML = '';
      
      // Add current user if not in list
      const userEntry = { name: app.user ? app.user.name : 'You', score: app.data.balance, highlight: true };
      const sorted = [...this.leaderboard, userEntry].sort((a,b) => b.score - a.score);
      
      sorted.slice(0, 10).forEach((p, i) => {
          const div = document.createElement('div');
          div.style.display = 'flex';
          div.style.justifyContent = 'space-between';
          div.style.padding = '8px';
          div.style.borderBottom = '1px solid #333';
          if(p.highlight) div.style.background = 'rgba(255,215,0,0.1)';
          
          let rankColor = '#666';
          if(i===0) rankColor = 'var(--gold-1)';
          if(i===1) rankColor = '#c0c0c0';
          if(i===2) rankColor = '#cd7f32';
          
          div.innerHTML = `
            <div style="display:flex;gap:10px">
                <span style="color:${rankColor};font-weight:bold;width:20px">${i+1}.</span>
                <span style="color:${p.highlight ? '#fff' : '#aaa'}">${p.name}</span>
            </div>
            <div style="color:var(--gold-2)">V$ ${p.score.toLocaleString()}</div>
          `;
          el.appendChild(div);
      });
  },

  addFriend() {
      const input = document.getElementById('friend-code-input');
      const code = input.value.trim().toUpperCase();
      
      if (!code || code.length !== 4) {
          app.toast("Invalid Friend Code", "Error");
          return;
      }
      
      if (code === app.data.profileCode) {
          app.toast("Cannot add yourself!", "Error");
          return;
      }
      
      if (app.data.friends.find(f => f.code === code)) {
          app.toast("Friend already added", "Error");
          return;
      }
      
      // Simulate adding friend (Mock Data with Cosmetics)
      const mockFriend = {
          code: code,
          name: "Player_" + code,
          balance: Math.floor(Math.random() * 50000) + 1000,
          favorite: ['Slots', 'Plinko', 'Blackjack'][Math.floor(Math.random() * 3)],
          equipped: {
              frame: Math.random() > 0.5 ? ['frame_gold', 'frame_diamond', 'frame_neon'][Math.floor(Math.random()*3)] : null,
              tag: Math.random() > 0.5 ? ['tag_high_roller', 'tag_whale', 'tag_vip'][Math.floor(Math.random()*3)] : null
          }
      };
      
      app.data.friends.push(mockFriend);
      app.save();
      this.renderFriends();
      input.value = "";
      app.toast("Friend Added!");
  },
  
  renderFriends() {
      const list = document.getElementById('friends-list');
      if(!list) return;
      list.innerHTML = "";
      
      if (!app.data.friends || app.data.friends.length === 0) {
          list.innerHTML = '<p style="text-align:center;color:#666;font-style:italic">No friends added yet.</p>';
          return;
      }
      
      app.data.friends.forEach(f => {
          const frameClass = f.equipped && f.equipped.frame ? f.equipped.frame.replace('_', '-') : '';
          const tagClass = f.equipped && f.equipped.tag ? f.equipped.tag.replace('_', '-') : '';
          const tagName = f.equipped && f.equipped.tag ? f.equipped.tag.replace('tag_', '').replace('_', ' ').toUpperCase() : '';
          
          const div = document.createElement('div');
          div.className = "panel-box";
          div.style.padding = "10px";
          div.style.background = "#1a1a1a";
          div.style.display = "flex";
          div.style.justifyContent = "space-between";
          div.style.alignItems = "center";
          
          div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px">
                <div class="level-badge ${frameClass}" style="position:static;width:30px;height:30px;font-size:12px;display:flex;align-items:center;justify-content:center">
                    ${f.name.charAt(0)}
                </div>
                <div>
                    <div style="color:#fff;font-weight:bold;display:flex;align-items:center">
                        ${f.name} <span style="color:#666;font-size:10px;margin-left:5px">#${f.code}</span>
                        ${tagClass ? `<span class="tag-badge ${tagClass}">${tagName}</span>` : ''}
                    </div>
                    <div style="color:var(--gold-2);font-size:12px">Fav: ${f.favorite}</div>
                </div>
            </div>
            <div style="text-align:right">
                <div style="color:var(--gold-1);font-weight:bold">V$ ${f.balance.toLocaleString()}</div>
                <div style="font-size:10px;color:var(--success)">Online</div>
            </div>
          `;
          list.appendChild(div);
      });
  }
};
