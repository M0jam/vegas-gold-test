/**
 * TWO-FACTOR AUTHENTICATION (TOTP)
 * Implements Google Authenticator compatible TOTP
 */
const TFA = {
    // Generate random Base32 secret
    generateSecret(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        for(let i = 0; i < length; i++) {
            secret += chars[array[i] % 32];
        }
        return secret;
    },

    async verify(secret, token) {
        if (!secret || !token) return false;
        
        // Check current window and previous window to account for drift
        const current = await this.generateTOTP(secret, 0);
        const prev = await this.generateTOTP(secret, -1);
        
        return token === current || token === prev;
    },

    async generateTOTP(secret, windowOffset = 0) {
        const epoch = Math.round(Date.now() / 1000.0);
        const time = Math.floor(epoch / 30) + windowOffset;
        
        // Base32 decode
        const key = this.base32tohex(secret);
        
        // Counter to hex
        const counter = this.dec2hex(time);
        
        // HMAC-SHA1
        const hmac = await this.hmacSha1(key, counter);
        
        // Truncate
        const offset = parseInt(hmac.substring(hmac.length - 1), 16);
        const otp = (parseInt(hmac.substr(offset * 2, 8), 16) & 0x7fffffff) + "";
        
        return (otp).substr(otp.length - 6, 6);
    },

    // Helpers
    dec2hex(s) {
        let v = s.toString(16);
        return (v.length % 2 === 0) ? v : "0" + v; // Pad
    },

    base32tohex(base32) {
        const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        let bits = "";
        let hex = "";

        for (let i = 0; i < base32.length; i++) {
            let val = base32chars.indexOf(base32.charAt(i).toUpperCase());
            bits += this.leftpad(val.toString(2), 5, '0');
        }

        for (let i = 0; i + 4 <= bits.length; i += 4) {
            let chunk = bits.substr(i, 4);
            hex = hex + parseInt(chunk, 2).toString(16);
        }
        return hex;
    },

    leftpad(str, len, pad) {
        if (len + 1 >= str.length) {
            str = Array(len + 1 - str.length).join(pad) + str;
        }
        return str;
    },

    async hmacSha1(keyHex, messageHex) {
        // Pad message to 16 chars (8 bytes) for counter
        while (messageHex.length < 16) messageHex = "0" + messageHex;
        
        const encoder = new TextEncoder();
        
        // Convert hex key to Uint8Array
        const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const msgBytes = new Uint8Array(messageHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        const key = await window.crypto.subtle.importKey(
            "raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
        );

        const signature = await window.crypto.subtle.sign("HMAC", key, msgBytes);
        
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
};
