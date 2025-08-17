const fs = require('fs');
const path = require('path');

// Local storage configuration
const STORAGE_DIR = path.join(__dirname, '../../storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Copy file to local storage
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

// Get local file path
const getFileUrl = async (key) => {
    const filePath = path.join(STORAGE_DIR, key);
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    throw new Error(`File not found: ${key}`);
};

// Delete local file
const deleteFile = async (key) => {
    const filePath = path.join(STORAGE_DIR, key);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${key}`);
    }
};

module.exports = {
    uploadFile,
    getFileUrl,
    deleteFile,
};
