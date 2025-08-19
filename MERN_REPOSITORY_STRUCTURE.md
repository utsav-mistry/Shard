# MERN Repository Structure Guide

This guide shows the required repository structure for deploying MERN (MongoDB, Express, React, Node.js) applications on the Shard platform.

## Required Repository Structure

```
your-mern-project/
├── backend/
│   ├── package.json          # Backend dependencies
│   ├── server.js             # Main server file (or app.js/index.js)
│   ├── routes/               # API routes
│   ├── models/               # Database models
│   ├── middleware/           # Custom middleware
│   └── controllers/          # Route controllers
├── frontend/
│   ├── package.json          # Frontend dependencies
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── components/
│   └── build/                # Generated after npm run build
└── README.md
```

## Backend Requirements

### package.json
Your backend `package.json` must include:

```json
{
  "name": "your-app-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  }
}
```

### server.js
Your main server file should:
- Listen on `process.env.PORT || 5000`
- Include CORS configuration
- Serve static files from frontend build

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', require('./routes/api'));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch all handler for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Frontend Requirements

### package.json
Your frontend `package.json` must include:

```json
{
  "name": "your-app-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-scripts": "5.0.1"
  },
  "proxy": "http://localhost:5000"
}
```

## Deployment Configuration

### Environment Variables
The platform will automatically inject these environment variables:
- `PORT=5000` (backend)
- `NODE_ENV=production`

### Build Process
1. Frontend is built using `npm run build`
2. Backend serves the built frontend files
3. API routes are available at `/api/*`
4. Frontend routes are handled by React Router

## Access URLs

After deployment, your MERN app will be accessible at:
- **Application**: `http://your-subdomain.localhost:12000/`
- **API Routes**: `http://your-subdomain.localhost:12000/api/`

## Example API Call from Frontend

```javascript
// In your React components
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
  }
};
```

## Common Issues and Solutions

### 1. Build Failures
- Ensure both `frontend/package.json` and `backend/package.json` exist
- Check that `npm run build` works locally in the frontend directory

### 2. API Connection Issues
- Use relative paths (`/api/...`) in frontend API calls
- Ensure backend serves static files from the correct build path

### 3. Port Configuration
- Backend should listen on `process.env.PORT || 5000`
- Don't hardcode port numbers in your application

### 4. CORS Issues
- Include CORS middleware in your backend
- Configure CORS to allow requests from your frontend domain

## Testing Locally

Before deploying, test your MERN app locally:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend (development)
cd frontend
npm install
npm start

# Or build and serve from backend
cd frontend
npm run build
cd ../backend
npm start
```

Your local app should work at:
- Development: `http://localhost:3000` (frontend) + `http://localhost:5000` (backend)
- Production: `http://localhost:5000` (backend serves frontend)
