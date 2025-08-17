# Shard Platform Documentation

**Shard** is a Vercel-style deployment platform with AI code review integration for MERN, Django, and Flask applications.

## Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB
- Docker

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
npm start  # Runs on port 5000
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm start  # Runs on port 3000
```

3. **Deployment Worker**
```bash
cd deployment-worker
npm install
npm start  # Runs on port 9000
```

4. **AI Review Service**
```bash
cd ai-review
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:10000
```

## Architecture

### Services
- **Frontend**: React app with deployment dashboard
- **Backend**: Node.js API with MongoDB
- **Deployment Worker**: Docker-based deployment processor
- **AI Review**: Django service for code analysis

### Supported Stacks
- **MERN**: React + Node.js applications
- **Django**: Python web applications
- **Flask**: Python microservices

## Key Features

### 🚀 One-Click Deployment
- Connect GitHub repositories
- Automatic framework detection
- Real-time deployment progress
- Live site links

### 🤖 AI Code Review
- Static analysis (ESLint, Pylint, Bandit)
- AI-powered code review with DeepSeek
- Severity-based deployment decisions
- Detailed issue reporting

### 🔧 Environment Management
- Secure environment variable handling
- Project-specific configurations
- Runtime environment injection

### 📊 Monitoring
- Real-time deployment logs
- Status tracking and notifications
- Health check endpoints

## API Endpoints

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Deployments
- `POST /api/deploy` - Trigger deployment
- `GET /api/deployments/:id` - Get deployment status
- `GET /api/deployments/:id/logs` - Get deployment logs

### Environment Variables
- `POST /api/env/:projectId` - Set environment variables
- `GET /api/env/:projectId` - Get environment variables

## Configuration

### Environment Variables
Create `.env` files in each service directory:

**Backend (.env)**
```
MONGODB_URI=mongodb://localhost:27017/shard
JWT_SECRET=your-jwt-secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASS=your-password
```

**AI Review (.env)**
```
DEEPSEEK_API_KEY=your-deepseek-key
DEBUG=False
```

## Deployment Process

1. **Repository Clone**: Git clone user repository
2. **AI Review**: Static analysis + AI code review
3. **Environment Setup**: Inject environment variables
4. **Docker Build**: Build using framework-specific Dockerfile
5. **Container Deploy**: Deploy to Docker with port mapping

## Port Configuration

- Frontend: 3000
- Backend: 5000
- Deployment Worker: 9000
- AI Review: 10000
- Django Apps: 13000
- Flask Apps: 14000
- MERN Apps: 12000

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# AI Review tests
cd ai-review && python manage.py test
```

### Docker Development
```bash
# Build all services
docker-compose up --build

# Individual service
docker build -f deployment-worker/dockerfiles/Dockerfile.mern .
```

## Troubleshooting

### Common Issues

**Deployment Failures**
- Check Docker daemon is running
- Verify port availability
- Review deployment logs

**AI Review Not Working**
- Ensure AI service is on port 10000
- Check DeepSeek API key
- Verify network connectivity

**Environment Variables**
- Confirm .env files exist
- Check variable encryption/decryption
- Validate project-specific isolation

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details
