# Shard - SaaS Deployment Platform

Shard is a comprehensive SaaS deployment platform that enables developers to deploy, manage, and monitor web applications with enterprise-grade security, automated AI code review, and seamless environment variable management.

## Overview

Shard provides a Vercel-like deployment experience with advanced features including AI-powered code review, secure environment variable management, and real-time deployment monitoring. The platform supports multiple technology stacks (MERN, Django, Flask) and offers a complete CI/CD pipeline for modern web applications.

## Latest Updates

### Authentication & UI Improvements
- **Fixed Sidebar Toggle**: Resolved sidebar open/close functionality across all screen sizes
- **User Display Names**: Fixed user display to show actual names instead of generic "User" fallback
- **OAuth Redirects**: Google and GitHub OAuth now properly redirect to `/app/` for users and `/admin` for admins
- **Admin Login**: Enhanced admin authentication with role-based redirects
- **Design System**: Applied consistent sharp corners and 2px borders across all components

### Completed Pages & Features
- **Documentation**: Comprehensive CLI reference and getting started guides
- **API Reference**: Complete API documentation with interactive examples
- **Support Center**: FAQ system and support contact options
- **Integrations**: GitHub integration with repository import functionality
- **Environment Variables**: Secure variable management with encryption
- **Deployment Pipeline**: Real-time deployment progress with AI review integration

## Key Features

### Automated Deployment
- One-click deployment from GitHub repositories
- Support for MERN, Django, and Flask stacks
- Automatic containerization and orchestration
- Real-time deployment status tracking

### AI-Powered Code Review
- Automated security vulnerability detection
- Code quality assessment
- Compliance checking
- Deployment approval workflow

### Environment Management
- Secure environment variable storage with encryption
- Project-specific configuration
- Runtime environment injection
- Audit trail for all changes

### Monitoring & Logs
- Real-time deployment logs
- Runtime application monitoring
- Performance metrics
- Error tracking and alerting

### Security
- JWT-based authentication
- OAuth integration (GitHub, Google)
- Encrypted environment variables
- Rate limiting and input validation
- CORS protection and security headers

## Complete User Flow

### 1. User Registration/Login
- Manual registration with email/password
- JWT-based authentication
- Secure session management

### 2. GitHub Integration
- OAuth-based GitHub connection
- Repository access and listing
- Automatic framework detection
- Branch and commit selection

### 3. Project Import & Deployment
- One-click repository import
- Custom subdomain assignment (e.g., `project-name-stellar-on`)
- Environment variable configuration
- AI-powered code review
- Docker containerization
- Custom domain mapping with PORT_CONFIG:
  - MERN: Frontend (12001), Backend (12000)
  - Django: Backend (13000)
  - Flask: Backend (14000)

### 4. Real-time Monitoring
- Live deployment progress tracking
- AI review results display
- Custom domain access
- Runtime logs and metrics

## Architecture

Shard is built as a microservices architecture with the following components:

### Frontend Dashboard
- React-based user interface
- Real-time deployment monitoring
- GitHub integration pages
- Project management interface
- Environment variable configuration
- Deployment logs and analytics

### Backend API
- Node.js/Express REST API
- MongoDB database integration
- JWT authentication system
- OAuth provider integration
- Environment variable encryption

### Deployment Worker
- Docker container orchestration
- Git repository cloning
- Environment variable injection
- Multi-stack deployment support
- Real-time log streaming

### AI Review Service
- Python-based code analysis
- Security vulnerability detection
- Code quality assessment
- Automated compliance checking

## Technology Stack

### Frontend
- **React 18** with modern hooks and context
- **Tailwind CSS** with custom design system (sharp corners, 2px borders)
- **Lucide React** for consistent iconography
- **React Router v6** for client-side routing
- **Axios** with interceptors for API communication

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication with refresh tokens
- **bcrypt** for secure password hashing
- **Winston** for structured logging

### Deployment Worker
- **Node.js** with job queue processing
- **Docker** for containerization and orchestration
- **Simple Git** for repository management
- **Real-time logging** with WebSocket integration

### AI Review Service
- **Python 3.12** with FastAPI
- **Machine learning models** for code analysis
- **Security vulnerability detection**
- **Code quality assessment**

### Infrastructure
- **Docker Compose** for local development
- **MongoDB** for data persistence
- **Nginx** for reverse proxy (production)
- **Environment-based configuration**

## API Documentation

### Authentication Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/github` - GitHub OAuth
- `GET /auth/google` - Google OAuth

### Project Management

- `POST /projects` - Create new project
- `GET /projects` - List user projects
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Environment Variables

- `POST /env` - Add environment variable
- `GET /env/:projectId` - Get project environment variables
- `DELETE /env/:id` - Delete environment variable

### Deployments

- `POST /deploy` - Create deployment
- `GET /deploy` - List deployments
- `GET /deploy/:id` - Get deployment details
- `POST /deploy/update-status` - Update deployment status

### Logs

- `GET /logs/:deploymentId` - Get deployment logs
- `POST /logs` - Create log entry

## Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB running locally or connection string
- Docker installed for deployment worker
- Git for repository management

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/utsav-mistry/shard.git
   cd shard
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install

   # Deployment Worker
   cd ../deployment-worker && npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp deployment-worker/.env.example deployment-worker/.env
   ```

4. **Start services**
   ```bash
   # Backend (Terminal 1)
   cd backend && npm start

   # Frontend (Terminal 2)
   cd frontend && npm start

   # Deployment Worker (Terminal 3)
   cd deployment-worker && npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin Panel: http://localhost:3000/admin

### First Time Setup
1. Register a new account at http://localhost:3000/auth/register
2. Connect your GitHub account in Integrations
3. Import a repository or create a new project
4. Configure environment variables
5. Deploy your application

## Deployment Process

1. **Project Creation**: User creates a project with repository URL and stack type
2. **Environment Configuration**: User adds environment variables for the project
3. **Deployment Trigger**: User initiates deployment from the dashboard
4. **AI Code Review**: AI service analyzes the code for security and quality issues
5. **Repository Cloning**: Worker clones the repository to local storage
6. **Environment Injection**: Environment variables are injected into the project
7. **Container Build**: Docker image is built with the project code
8. **Container Deployment**: Container is deployed and made accessible
9. **Real-time Monitoring**: Live logs and status are streamed to the dashboard

## Security Features

### Authentication & Authorization
- JWT-based token authentication
- OAuth integration with GitHub and Google
- Role-based access control
- Session management

### Data Protection
- Environment variable encryption at rest
- Secure transmission with HTTPS
- Input validation and sanitization
- SQL injection prevention

### Infrastructure Security
- Docker container isolation
- Network segmentation
- Rate limiting and DDoS protection
- Security headers implementation

## Monitoring & Analytics

### Deployment Metrics
- Deployment success/failure rates
- Build time tracking
- Resource utilization
- Performance benchmarks

### Application Monitoring
- Real-time log streaming
- Error tracking and alerting
- Performance monitoring
- Uptime tracking

### User Analytics
- User activity tracking
- Feature usage statistics
- Deployment patterns
- Resource consumption

## Scaling & Performance

### Horizontal Scaling
- Stateless API design
- Load balancer support
- Database connection pooling
- Caching strategies

### Performance Optimization
- Docker image optimization
- Build process optimization
- Database query optimization
- CDN integration

### Resource Management
- Container resource limits
- Auto-scaling capabilities
- Resource monitoring
- Cost optimization

## Deployment Worker Architecture

The Deployment Worker is the core component responsible for executing deployments. It operates as a standalone service that processes deployment jobs from a queue and manages the entire deployment lifecycle.

### Worker Components

#### Job Queue System
- **Queue Management**: In-memory job queue with FIFO processing
- **Job Persistence**: Jobs stored with project metadata and deployment parameters
- **Concurrency Control**: Sequential job processing to prevent resource conflicts
- **Error Handling**: Failed jobs logged with detailed error information

#### Repository Management
- **Git Cloning**: Clones repositories to isolated local directories
- **Branch Handling**: Supports main/master branch deployments
- **Cleanup**: Automatic cleanup of previous deployments
- **Version Control**: Maintains deployment history and rollback capabilities

#### Environment Variable Injection
- **Secure Retrieval**: Fetches encrypted environment variables from backend
- **Project Isolation**: Each project maintains separate environment configuration
- **Runtime Injection**: Environment variables injected into Docker containers
- **Validation**: Ensures environment variables meet security requirements

#### Docker Container Orchestration
- **Multi-Stack Support**: Pre-configured Dockerfiles for MERN, Django, and Flask
- **Port Management**: Dynamic port allocation to prevent conflicts
- **Resource Limits**: Memory and CPU constraints for container stability
- **Health Checks**: Container health monitoring and automatic restart

### Deployment Workflow

#### 1. Job Reception
```
Backend API → Job Queue → Worker Processing
```
- Backend creates deployment job with project metadata
- Job includes repository URL, stack type, and environment variables
- Worker polls queue every 5 seconds for new jobs

#### 2. Repository Processing
```
Git Clone → Code Analysis → Environment Setup
```
- Clones repository to `repos/{projectId}/` directory
- Performs AI code review for security and quality assessment
- Fetches and injects project-specific environment variables

#### 3. Container Build Process
```
Docker Build → Image Creation → Container Deployment
```
- Builds Docker image using stack-specific Dockerfile
- Creates container with unique subdomain and port mapping
- Starts container with environment variables and health monitoring

#### 4. Deployment Monitoring
```
Log Streaming → Status Updates → Health Monitoring
```
- Streams real-time logs to backend API
- Updates deployment status (pending, building, running, failed)
- Monitors container health and performance metrics

### Container Management

#### Port Allocation Strategy
- **MERN Stack**: Backend on port 12000, Frontend on port 12001
- **Django Stack**: Backend on port 13000
- **Flask Stack**: Backend on port 14000
- **Dynamic Mapping**: Host ports mapped to container ports

#### Resource Constraints
- **Memory Limit**: 512MB per container
- **CPU Allocation**: Fair share distribution
- **Storage**: Isolated file system per project
- **Network**: Containerized network isolation

#### Health Monitoring
- **Container Status**: Running, stopped, or failed states
- **Log Analysis**: Real-time log parsing and error detection
- **Performance Metrics**: CPU, memory, and network usage
- **Auto-Recovery**: Automatic restart on container failure

### Security Implementation

#### Environment Variable Security
- **Encryption**: Variables encrypted at rest in database
- **Runtime Decryption**: Secure decryption during deployment
- **Access Control**: Project-specific variable isolation
- **Audit Trail**: Complete logging of variable access and changes

#### Container Security
- **Isolation**: Complete container isolation from host system
- **Resource Limits**: Prevents resource exhaustion attacks
- **Network Security**: Isolated network for each container
- **Image Scanning**: Security scanning of base images

#### Access Control
- **Authentication**: JWT token validation for all operations
- **Authorization**: Project ownership verification
- **API Security**: Rate limiting and input validation
- **Audit Logging**: Complete audit trail of all operations

### Error Handling and Recovery

#### Deployment Failures
- **Build Failures**: Detailed error logging and user notification
- **Container Crashes**: Automatic restart with exponential backoff
- **Resource Exhaustion**: Graceful degradation and user alerts
- **Network Issues**: Retry mechanisms with circuit breaker pattern

#### Data Recovery
- **Repository Backup**: Local backup of cloned repositories
- **Configuration Backup**: Environment variable backup
- **Log Persistence**: Persistent storage of deployment logs
- **Rollback Capability**: Quick rollback to previous deployments

### Performance Optimization

#### Build Optimization
- **Layer Caching**: Docker layer caching for faster builds
- **Parallel Processing**: Concurrent job processing where possible
- **Resource Pooling**: Efficient resource allocation and reuse
- **Cleanup Routines**: Automatic cleanup of unused resources

#### Monitoring and Metrics
- **Deployment Metrics**: Success rates, build times, resource usage
- **Performance Tracking**: Response times and throughput monitoring
- **Resource Utilization**: CPU, memory, and storage optimization
- **Capacity Planning**: Predictive scaling based on usage patterns
