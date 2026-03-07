import crypto from 'crypto';

/**
 * AuthVault
 * 
 * Provides production-grade encryption (AES-256-GCM) for sensitive
 * credentials like API keys and OAuth2 tokens.
 * 
 * Requires VAULT_SECRET environment variable.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Utility to ensure we have a valid key
const getSecretKey = () => {
    const secret = process.env.VAULT_SECRET;
    if (!secret) {
        throw new Error('❌ VAULT_SECRET environment variable is missing.');
    }
    // Return a 32-byte key derived from the secret
    return crypto.createHash('sha256').update(secret).digest();
};

export const AuthVault = {
    /**
     * Encrypt a string
     * @param {string} text - The sensitive data to encrypt
     * @returns {string} - Encrypted string in format: iv:authTag:encryptedData (hex)
     */
    encrypt(text) {
        if (!text) return null;

        const iv = crypto.randomBytes(IV_LENGTH);
        const key = getSecretKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag().toString('hex');

        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    },

    /**
     * Decrypt a string
     * @param {string} encryptedText - The string in format: iv:authTag:encryptedData
     * @returns {string} - Decrypted original data
     */
    decrypt(encryptedText) {
        if (!encryptedText) return null;

        try {
            const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');

            if (!ivHex || !authTagHex || !encryptedData) {
                throw new Error('Invalid encrypted format');
            }

            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const key = getSecretKey();

            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (err) {
            console.error('❌ AuthVault Decryption Failed:', err.message);
            return null;
        }
    }
};
