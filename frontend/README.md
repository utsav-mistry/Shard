# Shard Frontend

This is the frontend application for Shard, a modern deployment platform for web applications. Built with React, Tailwind CSS, and modern JavaScript, Shard provides a seamless experience for deploying and managing your web projects.

## Features

- **User Authentication**
  - Email/password login and registration
  - Social authentication with GitHub and Google
  - Protected routes for authenticated users
  - User profile management
  - API key generation and management

- **Project Management**
  - Create new projects with GitHub repository integration
  - Support for multiple technology stacks (MERN, Django, Flask)
  - Custom subdomain configuration
  - Project details view with statistics
  - Project editing and deletion

- **Deployment Management**
  - Deploy projects from specific branches and commits
  - View deployment status and details
  - Real-time deployment logs with filtering by log type
  - Retry failed deployments
  - Download deployment logs

- **Environment Variable Management**
  - Create, edit, and delete environment variables
  - Support for regular and secret variables
  - Select which variables to include in deployments

- **User Experience**
  - Dark/light mode toggle with system preference detection
  - Responsive design for mobile and desktop
  - Interactive dashboard with project and deployment statistics
  - Real-time updates for deployment status

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Backend API server running (see backend directory)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```
4. Configure environment variables in the `.env` file:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   ```

### Running the Development Server

```bash
npm start
# or
yarn start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `build/` directory.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── auth/         # Authentication related components (ProtectedRoute)
│   └── layout/       # Layout components (Sidebar, Navbar, MainLayout, AuthLayout)
├── context/          # React context providers
│   └── AuthContext.js # Authentication context with user management
├── pages/            # Page components
│   ├── Auth/         # Authentication pages (Login, Register)
│   ├── Dashboard.js  # Main dashboard with statistics
│   ├── projects/     # Project management pages
│   │   ├── ProjectsList.js    # List of all projects
│   │   ├── ProjectDetail.js   # Detailed view of a project
│   │   └── NewProject.js      # Create new project form
│   ├── deployments/  # Deployment management pages
│   │   ├── DeploymentsList.js  # List of all deployments
│   │   ├── DeploymentDetail.js # Detailed view of a deployment
│   │   ├── DeploymentLogs.js   # Real-time logs viewer
│   │   └── NewDeployment.js    # Create new deployment form
│   ├── environment/  # Environment variable management
│   │   ├── EnvironmentVariables.js    # List of environment variables
│   │   ├── NewEnvironmentVariable.js  # Create new variable form
│   │   └── EditEnvironmentVariable.js # Edit existing variable
│   ├── logs/         # System logs viewing pages
│   └── Settings.js   # User settings and preferences
├── App.js            # Main application component with routing
├── index.js          # Application entry point
└── index.css         # Global styles with Tailwind CSS
```

## Key Features Implementation

### Authentication Flow

- **AuthContext.js**: Manages user authentication state, login/logout functionality, and token storage
- **ProtectedRoute.js**: Prevents unauthorized access to protected routes
- **Login.js/Register.js**: User authentication forms with social login options

### Project Management

- **ProjectsList.js**: Displays all projects with filtering and search
- **ProjectDetail.js**: Shows project details, environment variables, and recent deployments
- **NewProject.js**: Form for creating new projects with GitHub repository integration

### Deployment System

- **NewDeployment.js**: Configures and initiates new deployments with branch/commit selection
- **DeploymentDetail.js**: Shows deployment status, configuration, and environment variables
- **DeploymentLogs.js**: Real-time log viewer with filtering by log type

### UI/UX Features

- **Dark Mode**: Toggle between light and dark themes with system preference detection
- **Responsive Design**: Mobile-friendly layouts with sidebar toggle for small screens
- **Status Indicators**: Visual indicators for deployment status (pending, running, success, failed)

## Technologies Used

- **React.js**: Frontend library for building the user interface
- **React Router**: For application routing and navigation
- **Axios**: HTTP client for API requests
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: SVG icon library
- **localStorage**: For persisting authentication tokens and user preferences

## API Integration

The frontend communicates with the backend API for:

- User authentication and profile management
- Project CRUD operations
- Deployment creation and management
- Environment variable management
- Log retrieval and filtering

API requests are authenticated using JWT tokens stored in localStorage.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.