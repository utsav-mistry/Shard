# Shard Frontend
## Enterprise AI-Powered Deployment Platform - React Dashboard

**Vaultify Internal Project** - Production-ready React frontend for the Shard deployment platform with integrated AI code review, real-time monitoring, and enterprise-grade user experience.

## Technology Stack

<table border="1" style="border-collapse: collapse; width: 100%;">
<tr>
<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #333333; color: white;"><strong>Component</strong></th>
<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #333333; color: white;"><strong>Technology</strong></th>
<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #333333; color: white;"><strong>Purpose</strong></th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Frontend Framework</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">React with Context API</td>
<td style="border: 1px solid #ddd; padding: 8px;">Modern SPA with component architecture</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Styling</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Tailwind CSS + PostCSS</td>
<td style="border: 1px solid #ddd; padding: 8px;">Utility-first CSS with dark mode support</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Routing</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">React Router v6</td>
<td style="border: 1px solid #ddd; padding: 8px;">Client-side routing with protected routes</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>HTTP Client</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Axios</td>
<td style="border: 1px solid #ddd; padding: 8px;">API requests with interceptors</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Icons</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Lucide React</td>
<td style="border: 1px solid #ddd; padding: 8px;">SVG icon library</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>UI Components</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Headless UI</td>
<td style="border: 1px solid #ddd; padding: 8px;">Accessible component primitives</td>
</tr>
</table>

## Enterprise Features

### **Advanced Authentication System**
- **Multi-Provider OAuth** - GitHub, Google, and email/password authentication
- **Role-Based Access Control** - User and admin roles with granular permissions
- **JWT Token Management** - Secure authentication with automatic refresh
- **Session Persistence** - Maintains user state across browser sessions
- **Admin Dashboard Access** - Automatic role detection and admin redirects

### **Industry-Grade Deployment Experience**
- **One-Click Deployments** - Deploy from project detail page instantly
- **Real-Time Progress Tracking** - Visual deployment pipeline with live updates
- **AI Review Integration** - Code analysis results displayed in deployment flow
- **Branch & Commit Selection** - Deploy from specific Git references
- **Deployment History** - Complete deployment timeline with status tracking

### **AI-Powered Code Review Dashboard**
- **Multi-Model Analysis Results** - Display results from 6 different AI models
- **Security Vulnerability Visualization** - OWASP compliance and CVE integration
- **Code Quality Metrics** - Maintainability scoring and performance insights
- **Automated Verdict Display** - Approve/deny/manual review recommendations
- **Repository Context Analysis** - Cross-file relationship mapping

### **Enterprise Project Management**
- **GitHub Repository Integration** - Automatic framework detection and setup
- **Multi-Stack Support** - MERN, Django, Flask with auto-configuration
- **Custom Subdomain Generation** - Unique project URLs with SSL
- **Environment Variable Management** - AES-256 encrypted variable storage
- **Project Analytics** - Deployment success rates and performance metrics

### **Advanced Environment Management**
- **Secure Variable Storage** - Masked display with reveal functionality
- **UPPER_SNAKE_CASE Validation** - Automatic format enforcement
- **Duplicate Detection** - Prevents variable conflicts
- **Runtime Injection Preview** - Shows how variables will be deployed
- **Secret Flagging** - Special handling for sensitive data

### **Real-Time Monitoring & Logs**
- **Live Deployment Logs** - WebSocket-based streaming with filtering
- **System Health Dashboard** - Service status and performance metrics
- **Error Tracking** - Comprehensive error logging and analysis
- **Performance Analytics** - Response times and resource utilization
- **Audit Trails** - Complete operation history for compliance

### **Modern User Experience**
- **Dark/Light Mode** - System preference detection with manual toggle
- **Responsive Design** - Mobile-first approach with desktop optimization
- **Accessibility** - WCAG compliant with keyboard navigation
- **Progressive Loading** - Skeleton screens and optimistic updates
- **Contextual Help** - In-app guidance and tooltips
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