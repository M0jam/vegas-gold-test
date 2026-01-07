/**
 * AUTHENTICATION SYSTEM
 * Handles user persistence, encryption, and session management.
 */
const AuthSystem = {
    dbKey: 'vg_users_db',
    sessionKey: 'vg_session_token',

    init() {
        // Check for existing session
        this.checkSession();
    },

    // --- SECURE DATABASE SIMULATION ---

    // Get entire DB (decrypted)
    getDB() {
        const raw = localStorage.getItem(this.dbKey);
        if (!raw) return {};
        try {
            return JSON.parse(this.decrypt(raw));
        } catch (e) {
            console.error("DB Corruption", e);
            return {};
        }
    },

    // Save DB (encrypted)
    saveDB(db) {
        const str = JSON.stringify(db);
        localStorage.setItem(this.dbKey, this.encrypt(str));
    },

    // Simple XOR cipher for "Encryption" simulation (since we lack server-side env)
    // In a real app, this would be HTTPS + Server-side bcrypt
    encrypt(text) {
        const key = 'VEGAS_GOLD_SECRET';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result); // Base64 encode
    },

    decrypt(ciphertext) {
        try {
            const text = atob(ciphertext);
            const key = 'VEGAS_GOLD_SECRET';
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (e) {
            return "{}";
        }
    },

    async hashPassword(password) {
        if (window.crypto && window.crypto.subtle) {
            try {
                const msgBuffer = new TextEncoder().encode(password);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch(e) {
                console.warn("Crypto API error, falling back to simple hash", e);
            }
        }
        
        // Fallback for non-secure contexts (e.g. file://)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return "insecure_" + Math.abs(hash).toString(16);
    },

    // --- USER MANAGEMENT ---

    async register(email, password, name) {
        const db = this.getDB();
        if (db[email]) {
            return { success: false, error: "User already exists" };
        }

        const hash = await this.hashPassword(password);
        db[email] = {
            name: name,
            hash: hash,
            created: Date.now(),
            lastLogin: Date.now()
        };
        
        this.saveDB(db);
        return { success: true };
    },

    async login(email, password, remember = false) {
        const db = this.getDB();
        const user = db[email];
        
        if (!user) return { success: false, error: "User not found" };
        
        const hash = await this.hashPassword(password);
        if (user.hash !== hash) return { success: false, error: "Invalid password" };
        
        // 2FA Check
        if (user.twoFactorEnabled) {
            return { success: false, requires2FA: true };
        }
        
        return this.createSession(email, remember);
    },

    async verify2FA(email, code, remember = false) {
        const db = this.getDB();
        const user = db[email];
        
        if (!user || !user.twoFactorEnabled) return { success: false, error: "Invalid request" };
        
        const valid = await TFA.verify(user.twoFactorSecret, code);
        if (!valid) return { success: false, error: "Invalid 2FA Code" };
        
        return this.createSession(email, remember);
    },

    createSession(email, remember) {
        const db = this.getDB();
        const user = db[email];
        
        user.lastLogin = Date.now();
        this.saveDB(db);
        
        const sessionData = { email, name: user.name, expires: Date.now() + (remember ? 30*24*60*60*1000 : 24*60*60*1000) };
        localStorage.setItem(this.sessionKey, this.encrypt(JSON.stringify(sessionData)));
        
        return { success: true, user: { email, name: user.name } };
    },

    logout() {
        localStorage.removeItem(this.sessionKey);
        // Also clear app state
        if(window.app) {
            app.user = null;
            app.nav('home');
            window.location.reload(); // Cleanest way to reset all modules
        }
    },

    checkSession() {
        const raw = localStorage.getItem(this.sessionKey);
        if(!raw) return null;
        
        try {
            const session = JSON.parse(this.decrypt(raw));
            if (Date.now() > session.expires) {
                localStorage.removeItem(this.sessionKey);
                return null;
            }
            return session;
        } catch(e) {
            return null;
        }
    },

    // Account Recovery Simulation
    recover(email) {
        const db = this.getDB();
        if(!db[email]) return false;
        
        // In real app: Send email. Here: Mock toast.
        return true;
    },

    // --- ACCOUNT MANAGEMENT ---

    async changePassword(email, oldPass, newPass) {
        const db = this.getDB();
        const user = db[email];
        if (!user) return { success: false, error: "User not found" };

        const oldHash = await this.hashPassword(oldPass);
        if (user.hash !== oldHash) return { success: false, error: "Current password incorrect" };

        user.hash = await this.hashPassword(newPass);
        this.saveDB(db);
        return { success: true };
    },

    async init2FA(email) {
        const db = this.getDB();
        const user = db[email];
        if (!user) return { success: false, error: "User not found" };

        const secret = TFA.generateSecret();
        user.tempSecret = secret; // Store temporarily until confirmed
        this.saveDB(db);

        // In a real app, you'd generate a QR code URL here
        // For now, we'll return the secret for manual entry or QR generation
        return { success: true, secret: secret, otpauth: `otpauth://totp/VegasGold:${email}?secret=${secret}&issuer=VegasGold` };
    },

    async confirm2FA(email, code) {
        const db = this.getDB();
        const user = db[email];
        if (!user || !user.tempSecret) return { success: false, error: "2FA initialization not found" };

        const valid = await TFA.verify(user.tempSecret, code);
        if (!valid) return { success: false, error: "Invalid code" };

        user.twoFactorEnabled = true;
        user.twoFactorSecret = user.tempSecret;
        delete user.tempSecret;
        this.saveDB(db);
        return { success: true };
    },

    async disable2FA(email, password) {
        const db = this.getDB();
        const user = db[email];
        if (!user) return { success: false, error: "User not found" };

        const hash = await this.hashPassword(password);
        if (user.hash !== hash) return { success: false, error: "Invalid password" };

        user.twoFactorEnabled = false;
        delete user.twoFactorSecret;
        this.saveDB(db);
        return { success: true };
    }
};
