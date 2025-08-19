/**
 * @fileoverview Encryption and Hashing Utilities
 * @description Provides secure encryption, decryption, and hashing functions
 *              using Node.js crypto module with best practices
 * @module utils/encryptor
 * @requires crypto
 * @author Utsav Mistry
 * @version 1.0.0
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16
const SECRET_KEY = process.env.ENCRYPTION_SECRET || "fallback_key_32_characters_minimum!!";

/**
 * Encrypts a string using AES-256-CBC with a random IV
 * @function encrypt
 * @param {string} text - The text to encrypt
 * @returns {string} Encrypted string in format: iv:encryptedText
 * @throws {Error} If encryption fails
 * @example
 * const encrypted = encrypt('sensitive data');
 * // Returns: 'a1b2c3d4...:encryptedData'
 */
const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
};

/**
 * Decrypts a string encrypted with the encrypt function
 * @function decrypt
 * @param {string} text - The encrypted text in format: iv:encryptedText
 * @returns {string} Decrypted string
 * @throws {Error} If decryption fails or input is invalid
 * @example
 * const decrypted = decrypt(encryptedData);
 * // Returns: 'original data'
 */
const decrypt = (text) => {
    const [ivHex, encryptedHex] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

module.exports = { encrypt, decrypt };
