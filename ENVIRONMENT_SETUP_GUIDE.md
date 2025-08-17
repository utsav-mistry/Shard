# Shard Platform - Environment Setup Guide

This guide provides detailed instructions for setting up all required environment variables and external services for the Shard deployment platform.

## Environment Variables Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shard-platform?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Data Encryption
ENCRYPTION_SECRET=your-32-character-encryption-key

# Logging Configuration
LOG_LEVEL=info
CONSOLE_LOG_LEVEL=debug

# Email Service (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@shard-platform.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# External Services
AI_SERVICE_URL=http://localhost:8000
DEPLOYMENT_WORKER_URL=http://localhost:9000

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Cache Configuration
CACHE_TTL=600
CACHE_MAX_KEYS=1000

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Detailed Setup Instructions

### 1. MongoDB Atlas Setup

**Step 1: Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Verify your email address

**Step 2: Create a Cluster**
1. Click "Create a New Cluster"
2. Choose "Shared" (free tier)
3. Select your preferred cloud provider and region
4. Click "Create Cluster" (takes 3-5 minutes)

**Step 3: Create Database User**
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and password (save these!)
5. Set user privileges to "Read and write to any database"
6. Click "Add User"

**Step 4: Configure Network Access**
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
4. Click "Confirm"

**Step 5: Get Connection String**
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `shard-platform`

**Example MONGO_URI:**
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/shard-platform?retryWrites=true&w=majority
```

### 2. JWT Configuration

**JWT_SECRET:**
Generate a secure random string (32+ characters):
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

**JWT_EXPIRES_IN:**
- `7d` = 7 days
- `24h` = 24 hours
- `30m` = 30 minutes

### 3. Encryption Secret

Generate a 32-character encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 4. Email Service (Gmail SMTP)

**Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security"
3. Enable "2-Step Verification"

**Step 2: Generate App Password**
1. In Security settings, find "App passwords"
2. Select "Mail" and "Other (custom name)"
3. Enter "Shard Platform" as the name
4. Copy the generated 16-character password
5. Use this as `SMTP_PASS` (not your regular Gmail password)

**Configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # 16-character app password
SMTP_FROM=noreply@yourapp.com
```

### 5. Google OAuth Setup

**Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project"
3. Enter project name: "Shard Platform"
4. Click "Create"

**Step 2: Enable Google+ API**
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

**Step 3: Configure OAuth Consent Screen**
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in application details:
   - App name: "Shard Platform"
   - User support email: your email
   - Developer contact: your email
4. Add scopes: `email`, `profile`
5. Save and continue

**Step 4: Create OAuth Credentials**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:3000/auth/google/callback`
5. Copy Client ID and Client Secret

### 6. GitHub OAuth Setup

**Step 1: Create GitHub OAuth App**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   - Application name: "Shard Platform"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Click "Register application"

**Step 2: Get Credentials**
1. Copy the "Client ID"
2. Click "Generate a new client secret"
3. Copy the "Client Secret" immediately (it won't be shown again)

### 7. External Services

**AI Service (Django):**
- Default: `http://localhost:8000`
- This should point to your AI review service

**Deployment Worker:**
- Default: `http://localhost:9000`
- This should point to your deployment worker service

## Security Best Practices

### Production Environment Variables

**Never commit `.env` files to version control!**

For production, use environment variable management services:
- **Heroku:** Config Vars
- **Vercel:** Environment Variables
- **AWS:** Systems Manager Parameter Store
- **Docker:** Environment variables in docker-compose

### Environment Variable Validation

Add this validation to your `server.js`:

```javascript
const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'ENCRYPTION_SECRET'
];

requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
});
```

## Testing Your Configuration

### 1. Database Connection Test
```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err.message));
"
```

### 2. Email Service Test
```bash
node -e "
require('dotenv').config();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
transporter.verify()
.then(() => console.log('✅ SMTP configured correctly'))
.catch(err => console.error('❌ SMTP error:', err.message));
"
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
- Check username/password in connection string
- Verify IP address is whitelisted
- Ensure cluster is running

**SMTP Authentication Failed:**
- Use App Password, not regular Gmail password
- Enable 2-Factor Authentication first
- Check SMTP settings

**OAuth Redirect URI Mismatch:**
- Ensure callback URLs match exactly
- Include both development and production URLs
- Check for trailing slashes

**Environment Variables Not Loading:**
- Install `dotenv`: `npm install dotenv`
- Add to top of server.js: `require('dotenv').config()`
- Check `.env` file is in correct directory

## Development vs Production

### Development (.env)
```env
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### Production
```env
NODE_ENV=production
FRONTEND_URL=https://your-app.com
GOOGLE_REDIRECT_URI=https://your-app.com/api/auth/google/callback
```

Remember to update OAuth callback URLs in Google/GitHub when deploying to production!
