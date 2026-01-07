/**
 * PROFILE SYSTEM
 * Handles user profile interactions, dropdowns, and settings
 */
const ProfileSystem = {
    logs: [],
    
    init() {
        if(app.data.profile) {
            this.logs = app.data.profile.logs || [];
        }
        
        // Initialize UI if user is logged in
        if(app.user) {
            this.updateHeaderUI();
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('profile-dropdown');
            const avatar = document.querySelector('.avatar-circle');
            
            if (dropdown && !dropdown.classList.contains('hidden')) {
                if (!dropdown.contains(e.target) && !avatar.contains(e.target)) {
                    this.closeDropdown();
                }
            }
        });
    },

    toggleDropdown() {
        if (!app.user) return;
        
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown.classList.contains('hidden')) {
            this.openDropdown();
        } else {
            this.closeDropdown();
        }
    },

    openDropdown() {
        const dropdown = document.getElementById('profile-dropdown');
        dropdown.classList.remove('hidden');
        this.updateDropdownUI();
        this.switchTab('profile'); // Default tab
    },

    closeDropdown() {
        const dropdown = document.getElementById('profile-dropdown');
        if(dropdown) dropdown.classList.add('hidden');
    },

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(tabName)) {
                btn.classList.add('active');
            }
        });

        // Clear content area
        const content = document.querySelector('.profile-dropdown .dropdown-content') || this.createContentArea();
        content.innerHTML = '';

        // Render content based on tab
        switch(tabName) {
            case 'profile':
                this.renderProfileTab(content);
                break;
            case 'settings':
                this.renderSettingsTab(content);
                break;
            case 'stats':
                this.renderStatsTab(content);
                break;
        }
    },

    createContentArea() {
        const dropdown = document.getElementById('profile-dropdown');
        // Check if exists
        let content = dropdown.querySelector('.dropdown-content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'dropdown-content';
            content.style.padding = '15px';
            content.style.maxHeight = '400px';
            content.style.overflowY = 'auto';
            dropdown.appendChild(content);
        }
        return content;
    },

    // ==========================================
    // RENDER TABS
    // ==========================================

    renderProfileTab(container) {
        const currentAvatar = (app.data.profile && app.data.profile.avatar) 
            ? app.data.profile.avatar 
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user.name}`;

        container.innerHTML = `
            <div class="profile-section center-text" style="position:relative;">
                <div id="profile-loading" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.4); backdrop-filter: blur(2px); align-items:center; justify-content:center; border-radius:8px;">
                    <div class="vg-spinner" aria-label="Loading"></div>
                </div>
                <div class="avatar-upload-wrapper" style="position:relative; width:90px; height:90px; margin:0 auto 15px;">
                    <img src="${currentAvatar}" class="avatar-lg" id="profile-edit-avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:2px solid var(--gold-primary);">
                    <label for="avatar-upload" class="avatar-edit-btn icon-btn" aria-label="Edit profile picture" style="position:absolute; bottom:-6px; right:-6px; background:var(--gold-primary); color:#000; width:36px; height:36px; border-radius:50%; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,0.4);">
                        <svg class="vg-icon"><use href="#icon-camera"/></svg>
                    </label>
                    <input type="file" id="avatar-upload" hidden accept="image/*" onchange="ProfileSystem.handleAvatarUpload(this)">
                </div>
                
                <div class="floating-field" style="margin-bottom:15px;">
                    <input type="text" id="edit-username" value="${app.user.name}" class="gold-input" placeholder=" ">
                    <label class="floating-label"><svg class="vg-icon" style="margin-right:6px"><use href="#icon-id"/></svg>Display Name</label>
                </div>
                <button class="gold-btn sm icon-btn" onclick="ProfileSystem.saveName()" aria-label="Save display name" style="margin-bottom:15px;">
                    <svg class="vg-icon" style="margin-right:6px"><use href="#icon-save"/></svg> Save
                </button>

                <div class="premade-avatars">
                    <label style="display:block; margin-bottom:10px; font-size:12px; color:var(--text-muted);">Or choose an avatar:</label>
                    <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:5px;">
                        ${this.getPremadeAvatars().map(url => `
                            <img src="${url}" class="avatar-option" onclick="ProfileSystem.selectAvatar('${url}')" aria-label="Select avatar"
                            style="width:44px; height:44px; border-radius:50%; cursor:pointer; border:1px solid #333; transition:transform 160ms ease, border-color 160ms ease;">
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderSettingsTab(container) {
        const tfaEnabled = app.data.profile && app.data.profile.twoFactorEnabled;

        container.innerHTML = `
            <div class="settings-section">
                <h4 style="color:var(--gold-light); border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:15px;"><i class="fas fa-shield-alt" style="margin-right:8px; color:var(--gold-primary)"></i>Security</h4>
                <div class="form-group" style="margin-bottom:20px;">
                    <label><i class="fas fa-key" style="margin-right:6px; color:var(--gold-primary)"></i>Change Password</label>
                    <input type="password" id="old-pass" placeholder="Current Password" class="gold-input" style="margin-bottom:5px;">
                    <input type="password" id="new-pass" placeholder="New Password" class="gold-input" style="margin-bottom:5px;">
                    <button class="gold-btn sm" onclick="ProfileSystem.changePassword()" style="width:100%;"><i class="fas fa-lock"></i> Update Password</button>
                </div>

                <div class="form-group">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <label><i class="fas fa-shield-alt" style="margin-right:6px; color:var(--gold-primary)"></i>Two-Factor Auth</label>
                        <label class="switch">
                            <input type="checkbox" id="tfa-toggle" ${tfaEnabled ? 'checked' : ''} onchange="ProfileSystem.toggle2FA(this)">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div id="tfa-setup-area" style="display:none; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; margin-top:10px;">
                        <div id="tfa-qr" style="text-align:center; margin-bottom:10px; background:#fff; padding:10px; display:inline-block;"></div>
                        <div style="font-family:monospace; font-size:10px; word-break:break-all; margin-bottom:10px; color:var(--gold-light);" id="tfa-secret"></div>
                        <input type="text" id="tfa-verify" placeholder="Enter 6-digit code" class="gold-input" maxlength="6" style="text-align:center; letter-spacing:5px;">
                        <button class="gold-btn sm" onclick="ProfileSystem.confirm2FA()" style="width:100%; margin-top:5px;"><i class="fas fa-check"></i> Verify & Enable</button>
                    </div>

                    <div id="tfa-disable-area" style="display:none; background:rgba(255,0,0,0.1); padding:10px; border-radius:8px; margin-top:10px; border:1px solid rgba(255,0,0,0.3);">
                        <p style="font-size:12px; color:#ff6b6b; margin-bottom:10px;">Enter password to disable 2FA:</p>
                        <input type="password" id="tfa-disable-pass" placeholder="Current Password" class="gold-input">
                        <div style="display:flex; gap:5px; margin-top:5px;">
                            <button class="gold-btn sm" onclick="ProfileSystem.confirmDisable2FA()" style="flex:1;"><i class="fas fa-shield-alt"></i> Confirm</button>
                            <button class="gold-btn sm secondary" onclick="ProfileSystem.cancelDisable2FA()" style="flex:1;">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderStatsTab(container) {
        const stats = app.data.stats || {
            spins: 0,
            wins: 0,
            bigWins: 0,
            totalWagered: 0,
            playTime: 0 // minutes
        };

        // Format Playtime
        const hours = Math.floor(stats.playTime / 60);
        const mins = stats.playTime % 60;

        container.innerHTML = `
            <div class="stats-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; text-align:center;">
                    <div style="color:var(--gold-primary); font-size:18px; font-weight:bold;">${stats.spins.toLocaleString()}</div>
                    <div style="font-size:10px; text-transform:uppercase; color:#888;"><i class="fas fa-dice" style="margin-right:6px;"></i>Total Spins</div>
                </div>
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; text-align:center;">
                    <div style="color:var(--gold-primary); font-size:18px; font-weight:bold;">${stats.wins.toLocaleString()}</div>
                    <div style="font-size:10px; text-transform:uppercase; color:#888;"><i class="fas fa-trophy" style="margin-right:6px;"></i>Total Wins</div>
                </div>
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; text-align:center;">
                    <div style="color:var(--gold-primary); font-size:18px; font-weight:bold;">$${stats.totalWagered.toLocaleString()}</div>
                    <div style="font-size:10px; text-transform:uppercase; color:#888;"><i class="fas fa-coins" style="margin-right:6px;"></i>Wagered</div>
                </div>
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; text-align:center;">
                    <div style="color:var(--gold-primary); font-size:18px; font-weight:bold;">${hours}h ${mins}m</div>
                    <div style="font-size:10px; text-transform:uppercase; color:#888;"><i class="fas fa-hourglass-half" style="margin-right:6px;"></i>Play Time</div>
                </div>
            </div>
            
            <div style="margin-top:20px;">
                <h5 style="color:#fff; margin-bottom:10px;">Recent Activity</h5>
                <div id="mini-audit-log" style="font-size:11px; color:#aaa; max-height:150px; overflow-y:auto;">
                    ${this.logs.length ? '' : 'No activity recorded.'}
                </div>
            </div>
        `;

        // Populate logs
        if(this.logs.length) {
            const logContainer = container.querySelector('#mini-audit-log');
            this.logs.slice().reverse().slice(0, 10).forEach(log => {
                const div = document.createElement('div');
                div.style.padding = '4px 0';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.innerHTML = `<span style="color:var(--gold-dark)">${new Date(log.ts).toLocaleDateString()}</span> ${log.msg}`;
                logContainer.appendChild(div);
            });
        }
    },

    // ==========================================
    // ACTIONS
    // ==========================================

    updateHeaderUI() {
        const avatar = document.getElementById('header-avatar');
        const name = document.getElementById('username-disp');
        
        if (app.data.profile && app.data.profile.avatar) {
            avatar.src = app.data.profile.avatar;
        } else {
            avatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user.name}`;
        }
        
        name.textContent = app.user.name;
    },

    updateDropdownUI() {
        const dAvatar = document.getElementById('dropdown-avatar');
        const dName = document.getElementById('dropdown-name');
        
        if (app.data.profile && app.data.profile.avatar) {
            dAvatar.src = app.data.profile.avatar;
        } else {
            dAvatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user.name}`;
        }
        
        dName.innerHTML = '<i class="fas fa-crown" style="color:var(--gold-primary); margin-right:6px;"></i>' + app.user.name;
    },

    getPremadeAvatars() {
        return [
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky'
        ];
    },

    selectAvatar(url) {
        if(!app.data.profile) app.data.profile = {};
        app.data.profile.avatar = url;
        app.save();
        this.updateHeaderUI();
        this.updateDropdownUI();
        this.renderProfileTab(document.querySelector('.dropdown-content')); // Re-render to show selection
        app.toast("Avatar Updated");
        this.log("Changed avatar");
    },

    handleAvatarUpload(input) {
        const file = input.files[0];
        if(!file) return;

        // Validate
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            app.toast("Invalid file type", "Error");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            app.toast("File too large (Max 2MB)", "Error");
            return;
        }

        const loader = document.getElementById('profile-loading');
        if(loader) loader.style.display = 'flex';
        const reader = new FileReader();
        reader.onload = (e) => {
            // Simple resize logic could go here, for now direct save
            this.selectAvatar(e.target.result);
            if(loader) loader.style.display = 'none';
        };
        reader.readAsDataURL(file);
    },

    saveName() {
        const input = document.getElementById('edit-username');
        const newName = input.value.trim();
        
        if (newName.length < 3) {
            app.toast("Name must be at least 3 chars", "Error");
            return;
        }
        if (!/^[a-zA-Z0-9 ]+$/.test(newName)) {
            app.toast("No special characters allowed", "Error");
            return;
        }
        
        const oldName = app.user.name;
        app.user.name = newName;
        
        // Update Session
        localStorage.setItem('vg_session', JSON.stringify(app.user));
        
        app.save();
        this.updateHeaderUI();
        this.updateDropdownUI();
        app.toast("Username Updated");
        this.log(`Changed name from ${oldName} to ${newName}`);
    },

    async changePassword() {
        const oldPass = document.getElementById('old-pass').value;
        const newPass = document.getElementById('new-pass').value;

        if (!oldPass || !newPass) {
            app.toast("Please fill all fields", "Error");
            return;
        }

        // Validate password strength
        if (newPass.length < 8 || !/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
            app.toast("Password must be 8+ chars, with Upper, Lower & Number", "Error");
            return;
        }

        const res = await AuthSystem.changePassword(app.user.email, oldPass, newPass);
        if (res.success) {
            app.toast("Password Changed Successfully");
            document.getElementById('old-pass').value = '';
            document.getElementById('new-pass').value = '';
            this.log("Password changed");
        } else {
            app.toast(res.error, "Error");
        }
    },

    async toggle2FA(checkbox) {
        const setupArea = document.getElementById('tfa-setup-area');
        const disableArea = document.getElementById('tfa-disable-area');
        
        if (checkbox.checked) {
            // Enable flow
            disableArea.style.display = 'none';
            setupArea.style.display = 'block';
            
            const res = await AuthSystem.init2FA(app.user.email);
            
            if (res.success) {
                // Show QR
                const qrContainer = document.getElementById('tfa-qr');
                qrContainer.innerHTML = '';
                new QRCode(qrContainer, {
                    text: res.otpauth,
                    width: 128,
                    height: 128
                });
                document.getElementById('tfa-secret').textContent = res.secret;
            } else {
                checkbox.checked = false;
                setupArea.style.display = 'none';
                app.toast(res.error, "Error");
            }
        } else {
            // Disable flow - Request Password
            setupArea.style.display = 'none';
            disableArea.style.display = 'block';
        }
    },

    async confirmDisable2FA() {
        const passInput = document.getElementById('tfa-disable-pass');
        const password = passInput.value;
        
        if(!password) {
            app.toast("Password required", "Error");
            return;
        }
        
        const res = await AuthSystem.disable2FA(app.user.email, password);
        
        if (res.success) {
            app.data.profile.twoFactorEnabled = false;
            app.save();
            document.getElementById('tfa-disable-area').style.display = 'none';
            document.getElementById('tfa-disable-pass').value = '';
            app.toast("2FA Disabled");
            this.log("Disabled 2FA");
        } else {
            app.toast(res.error, "Error");
        }
    },

    cancelDisable2FA() {
        document.getElementById('tfa-disable-area').style.display = 'none';
        document.getElementById('tfa-toggle').checked = true; // Revert state
        document.getElementById('tfa-disable-pass').value = '';
    },

    async confirm2FA() {
        const code = document.getElementById('tfa-verify').value;
        if (code.length !== 6) {
            app.toast("Invalid Code", "Error");
            return;
        }

        const res = await AuthSystem.confirm2FA(app.user.email, code);
        if (res.success) {
            app.data.profile.twoFactorEnabled = true;
            app.save();
            document.getElementById('tfa-setup-area').style.display = 'none';
            app.toast("2FA Enabled!");
            this.log("Enabled 2FA");
        } else {
            app.toast(res.error, "Error");
        }
    },

    log(msg) {
        this.logs.push({ ts: Date.now(), msg });
        if(this.logs.length > 50) this.logs.shift();
        
        if(!app.data.profile) app.data.profile = {};
        app.data.profile.logs = this.logs;
        app.save();
    }
};

/**
 * COSMETICS SYSTEM
 * Handles skins, frames, and visual customization
 */
const Cosmetics = {
  init() {
    if(!app.data.equipped) app.data.equipped = { background: null, frame: null, tag: null };
    this.apply();
    this.render();
  },
  
  apply() {
    // Background
    const bg = app.data.equipped.background;
    document.body.className = ''; // Reset
    if(bg) document.body.classList.add(bg.replace('_', '-')); // bg_midnight -> bg-midnight
    
    // Frames and Tags are applied in render loops (Social, Profile)
    this.updateUserPanel();
  },
  
  updateUserPanel() {
      // Add frame/tag to user panel if visible
      const badge = document.getElementById('lvl-badge');
      if(badge) {
          badge.className = 'level-badge'; // Reset
          if(app.data.equipped.frame) {
             badge.classList.add(app.data.equipped.frame.replace('_', '-'));
          }
      }
      // Tag could be added next to name if we had name display in panel, but we have auth-ui
  },
  
  equip(type, id) {
    if(app.data.equipped[type] === id) {
        // Unequip
        app.data.equipped[type] = null;
    } else {
        app.data.equipped[type] = id;
    }
    app.save();
    this.apply();
    this.render();
    app.toast("Profile Updated", "Customization");
  },
  
  render() {
    const c = document.getElementById('wardrobe-grid');
    if(!c) return;
    c.innerHTML = '';
    
    const ownedCosmetics = VIPShop.items.filter(i => app.hasPerk(i.id));
    
    if(ownedCosmetics.length === 0) {
        c.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted)">You have no VIP items. Visit the VIP Boutique!</div>';
        return;
    }
    
    ownedCosmetics.forEach(item => {
        const isEquipped = app.data.equipped[item.type] === item.id;
        const div = document.createElement('div');
        div.className = `achievement-card ${isEquipped ? 'unlocked' : ''}`;
        div.style.borderColor = isEquipped ? 'var(--gold-1)' : '#333';
        
        div.innerHTML = `
            <div class="ach-icon">${item.icon}</div>
            <strong>${item.name}</strong>
            <div style="font-size:10px;text-transform:uppercase;color:#666">${item.type}</div>
            <button class="gold-btn ${isEquipped ? 'secondary' : ''}" style="width:100%;margin-top:5px;font-size:10px;padding:4px" onclick="Cosmetics.equip('${item.type}', '${item.id}')">
                ${isEquipped ? 'UNEQUIP' : 'EQUIP'}
            </button>
        `;
        c.appendChild(div);
    });
  }
};
