# Shard Backend API

This is the backend API server for Shard, a modern deployment platform for web applications. Built with Node.js, Express, and MongoDB, it provides a robust and scalable backend for the Shard platform.

## Features

- **Authentication System**
  - JWT-based authentication
  - Email/password registration and login
  - OAuth integration with GitHub and Google
  - Password reset functionality
  - API key generation and management

- **Project Management**
  - CRUD operations for projects
  - GitHub repository integration
  - Support for multiple technology stacks
  - Custom subdomain configuration

- **Deployment System**
  - Deployment creation and management
  - Integration with deployment worker
  - Environment variable injection
  - Deployment logs management

- **Environment Variable Management**
  - Secure storage of environment variables
  - Support for regular and secret variables
  - Variable encryption for sensitive data

- **Security Features**
  - Rate limiting to prevent abuse
  - Helmet for HTTP header security
  - CORS configuration
  - Input validation with Joi
  - Global error handling

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/shard

   # JWT Authentication
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d

   # OAuth Configuration
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

   # Email Configuration (Brevo/SMTP)
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   EMAIL_FROM=noreply@shard.dev

   # S3 Storage (Optional)
   S3_REGION=us-east-1
   S3_BUCKET=shard-logs
   S3_ACCESS_KEY=your_s3_access_key
   S3_SECRET_KEY=your_s3_secret_key
   ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

The API server will be available at [http://localhost:5000](http://localhost:5000).

### Running in Production

```bash
npm start
# or
yarn start
```

## Project Structure

```
backend/
├── config/           # Configuration files
│   ├── db.js         # Database connection
│   ├── passport.js   # OAuth strategies
│   └── smtp.js       # Email configuration
├── controllers/      # Route controllers
│   ├── authController.js    # Authentication logic
│   ├── projectController.js # Project management
│   ├── deployController.js  # Deployment operations
│   ├── envController.js     # Environment variables
│   └── logController.js     # Logging functionality
├── models/           # Mongoose models
│   ├── User.js       # User model
│   ├── Project.js    # Project model
│   ├── Deployment.js # Deployment model
│   └── EnvVar.js     # Environment variable model
├── routes/           # API routes
│   ├── auth.js       # Authentication routes
│   ├── project.js    # Project routes
│   ├── deploy.js     # Deployment routes
│   ├── env.js        # Environment variable routes
│   └── logs.js       # Logging routes
├── services/         # External services
│   └── storageService.js # S3 storage integration
├── utils/            # Utility functions
│   ├── authMiddleware.js  # Authentication middleware
│   ├── errorHandler.js    # Error handling
│   └── validators.js      # Input validation
├── server.js         # Main application entry
└── package.json      # Dependencies and scripts
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email/password
- `GET /auth/github` - GitHub OAuth login
- `GET /auth/google` - Google OAuth login
- `POST /auth/logout` - Logout user
- `POST /auth/reset-password` - Request password reset
- `PUT /auth/reset-password/:token` - Reset password with token
- `GET /auth/me` - Get current user profile
- `PUT /auth/me` - Update user profile
- `POST /auth/apikey` - Generate new API key
- `GET /auth/apikey` - List user API keys
- `DELETE /auth/apikey/:id` - Revoke API key

### Projects

- `GET /projects` - List all projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Deployments

- `POST /deploy` - Create new deployment
- `GET /deploy/:id` - Get deployment details
- `GET /deploy/project/:projectId` - List deployments for project
- `POST /deploy/:id/retry` - Retry failed deployment

### Environment Variables

- `GET /env/project/:projectId` - List environment variables for project
- `POST /env` - Create new environment variable
- `PUT /env/:id` - Update environment variable
- `DELETE /env/:id` - Delete environment variable

### Logs

- `GET /logs/:deploymentId` - Get logs for deployment
- `GET /logs/download/:deploymentId` - Download deployment logs

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Passport** - OAuth authentication
- **Nodemailer** - Email sending
- **Joi** - Input validation
- **Helmet** - HTTP security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting

## Integration with Other Services

The backend API integrates with the following services:

- **Frontend Dashboard** - React-based user interface
- **Deployment Worker** - Handles the actual deployment process
- **AI Review Service** - Provides code analysis and security scanning

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.