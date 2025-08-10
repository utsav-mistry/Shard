# Shard Deployment Worker

This is the deployment worker service for Shard, a modern deployment platform for web applications. The deployment worker is responsible for processing deployment jobs, cloning repositories, injecting environment variables, building Docker containers, and monitoring deployments.

## Features

- **Job Queue System**
  - In-memory job queue for deployment tasks
  - API endpoint for adding jobs to the queue
  - Continuous polling for new jobs

- **Repository Management**
  - Git repository cloning using simple-git
  - Support for multiple technology stacks
  - Automatic cleanup of previous deployments

- **Environment Variable Handling**
  - Secure injection of environment variables
  - Support for Docker environment files
  - Validation and sanitization of variables

- **Container Orchestration**
  - Docker container building and running
  - Stack-specific Dockerfile selection
  - Port mapping and container naming
  - Runtime log capturing

- **AI Code Review**
  - Integration with AI review service
  - Security vulnerability detection
  - Deployment blocking for security issues

- **Logging System**
  - Detailed deployment logs
  - Real-time log streaming to backend
  - Log categorization by type (setup, config, deploy, runtime, error)

- **Notification System**
  - Email notifications for deployment status
  - Success and failure notifications

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Docker
- npm or yarn
- Backend API server running
- AI Review service running (optional)

### Installation

1. Clone the repository
2. Navigate to the deployment-worker directory:
   ```bash
   cd deployment-worker
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

### Running the Worker

```bash
node worker.js
```

The worker API will be available at [http://localhost:9000](http://localhost:9000) and will start processing jobs from the queue.

## Project Structure

```
deployment-worker/
├── dockerfiles/        # Docker configuration files
│   ├── Dockerfile.mern    # MERN stack configuration
│   ├── Dockerfile.django  # Django stack configuration
│   └── Dockerfile.flask   # Flask stack configuration
├── services/           # Core services
│   ├── analyzeCode.js     # AI code review integration
│   ├── emailNotifier.js   # Email notification service
│   ├── envInjector.js     # Environment variable handling
│   ├── jobProcessor.js    # Main deployment processor
│   └── repoCloner.js      # Git repository management
├── utils/              # Utility functions
│   └── dockerHelpers.js   # Docker container management
├── logs/               # Deployment logs (created at runtime)
├── repos/              # Cloned repositories (created at runtime)
├── queue.js            # In-memory job queue implementation
└── worker.js           # Main worker application
```

## API Endpoints

### Job Queue

- `POST /queue` - Add a new deployment job to the queue
  - Required fields: `projectId`, `repoUrl`, `stack`, `subdomain`, `token`
  - Optional fields: `userEmail`, `deploymentId`, `envVars`

## Deployment Process

1. **Job Queuing**: Backend API adds job to the worker queue
2. **Repository Cloning**: Worker clones the Git repository
3. **AI Code Review**: Code is analyzed for security vulnerabilities
4. **Environment Configuration**: Environment variables are injected
5. **Container Building**: Docker image is built based on stack type
6. **Container Running**: Container is started with proper port mapping
7. **Log Streaming**: Runtime logs are captured and sent to backend
8. **Notification**: User is notified of deployment status

## Supported Technology Stacks

- **MERN** (MongoDB, Express, React, Node.js)
  - Port: 12000 (backend)
- **Django** (Python, Django)
  - Port: 13000
- **Flask** (Python, Flask)
  - Port: 14000

## Integration with Other Services

The deployment worker integrates with the following services:

- **Backend API**: For job submission, log storage, and status updates
- **AI Review Service**: For code security analysis
- **Email Service**: For deployment notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.