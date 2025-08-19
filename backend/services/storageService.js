/**
 * @fileoverview Storage Service
 * @description Handles local file storage operations for the Shard platform
 * @module services/storageService
 * @requires fs
 * @requires path
 * @author Utsav Mistry
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Local storage configuration
const STORAGE_DIR = path.join(__dirname, '../../storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Uploads file to local storage
 * @async
 * @function uploadFile
 * @param {string} key - Storage key/path for the file
 * @param {string} filePath - Source file path to copy from
 * @returns {Promise<void>}
 * @throws {Error} If file copy operation fails
 * @example
 * await uploadFile('projects/123/dockerfile', '/tmp/dockerfile');
 */
const uploadFile = async (key, filePath) => {
    const targetPath = path.join(STORAGE_DIR, key);
    const targetDir = path.dirname(targetPath);
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, targetPath);
    console.log(`Stored file locally: ${key}`);
};

/**
 * Gets local file path for stored file
 * @async
 * @function getFileUrl
 * @param {string} key - Storage key/path for the file
 * @returns {Promise<string>} Local file path
 * @throws {Error} If file not found
 * @example
 * const filePath = await getFileUrl('projects/123/dockerfile');
 */
const getFileUrl = async (key) => {
    const filePath = path.join(STORAGE_DIR, key);
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    throw new Error(`File not found: ${key}`);
};

/**
 * Deletes file from local storage
 * @async
 * @function deleteFile
 * @param {string} key - Storage key/path for the file
 * @returns {Promise<void>}
 * @example
 * await deleteFile('projects/123/dockerfile');
 */
const deleteFile = async (key) => {
    const filePath = path.join(STORAGE_DIR, key);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${key}`);
    }
};

/**
 * @namespace storageService
 * @description Service for local file storage operations
 */
module.exports = {
    uploadFile,
    getFileUrl,
    deleteFile,
};
