#!/usr/bin/env node

/**
 * Admin Creation Script for Shard Platform
 * 
 * This script creates a new admin user with the credentials specified below.
 * It can only be run once to prevent accidental admin creation.
 * 
 * EDIT THE CREDENTIALS BELOW BEFORE RUNNING:
 */

// ==========================================
// EDIT YOUR ADMIN CREDENTIALS HERE
// ==========================================
const ADMIN_CREDENTIALS = {
  email: 'utsavamistry30@gmail.com',        // Change this to your email
  password: 'admin@shard',              // Change this to a secure password
  username: 'admin',                 // Change this to your preferred username
  name : 'Utsav Mistry'                   // Change this to your last name
};
// ==========================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Import User model
const User = require('../models/User');

// Path to the lock file
const LOCK_FILE_PATH = path.join(__dirname, '.admin-created.lock');

// Database connection string - adjust if needed
const DB_URI = process.env.MONGODB_URI;

/**
 * Check if admin has already been created
 */
function checkLockFile() {
  if (fs.existsSync(LOCK_FILE_PATH)) {
    console.log('Admin user has already been created!');
    console.log('Delete the lock file to run again:', LOCK_FILE_PATH);
    process.exit(1);
  }
}

/**
 * Create lock file to prevent multiple runs
 */
function createLockFile() {
  const lockData = {
    createdAt: new Date().toISOString(),
    adminEmail: ADMIN_CREDENTIALS.email,
    note: 'This file prevents multiple admin creation. Delete to allow re-running the script.'
  };
  
  fs.writeFileSync(LOCK_FILE_PATH, JSON.stringify(lockData, null, 2));
  console.log(' Lock file created:', LOCK_FILE_PATH);
}

/**
 * Validate admin credentials
 */
function validateCredentials() {
  const { email, password, username, name } = ADMIN_CREDENTIALS;
  
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }
  
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters long');
  }
  
  if (!name) {
    throw new Error('Name is required');
  }
  
  // Check for default values
  if (email === 'admin@shard.local' && password === 'admin123') {
    console.log('WARNING: You are using default credentials!');
    console.log('Please edit the ADMIN_CREDENTIALS in this script before running.');
    console.log('Current email:', email);
    console.log('Current password: [HIDDEN]');
    
    // Ask for confirmation in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot use default credentials in production environment');
    }
  }
}

/**
 * Create admin user
 */
async function createAdminUser() {
  try {
    console.log('Checking if admin user already exists...');
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ 
      email: ADMIN_CREDENTIALS.email
    });
    
    if (existingUser) {
      throw new Error(`User with email "${ADMIN_CREDENTIALS.email}" already exists`);
    }
    
    console.log('Creating admin user...');
    const adminUser = new User({
      email: ADMIN_CREDENTIALS.email,
      passwordHash: ADMIN_CREDENTIALS.password, // Let the pre-save hook handle hashing
      name: ADMIN_CREDENTIALS.name,
      role: 'admin'
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully!');
    console.log('Email:', ADMIN_CREDENTIALS.email);
    console.log('Name:', ADMIN_CREDENTIALS.name);
    console.log('Role: admin');
    console.log('');
    console.log('You can now log in to the admin dashboard with these credentials.');
    
    return adminUser;
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('Shard Admin Creation Script');
  console.log('================================');
  console.log('');
  
  try {
    // Check if script has already been run
    checkLockFile();
    
    // Validate credentials
    console.log('Validating credentials...');
    validateCredentials();
    
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to database');
    
    // Create admin user
    await createAdminUser();
    
    // Create lock file
    createLockFile();
    
    console.log('');
    console.log('Admin creation completed successfully!');
    console.log('Script is now locked and cannot be run again.');
    console.log('To run again, delete:', LOCK_FILE_PATH);
    
  } catch (error) {
    console.error('');
    console.error('Script failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Database connection closed');
    }
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\nScript interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nScript terminated');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, ADMIN_CREDENTIALS };
