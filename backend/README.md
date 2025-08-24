# Shard Backend API
## Enterprise AI-Powered Deployment Platform - Node.js API Server

**Vaultify Internal Project** - Production-ready Express.js backend with MongoDB, JWT authentication, AI integration, and enterprise-grade security for the Shard deployment platform.

## Technology Stack

<table border="1" style="border-collapse: collapse; width: 100%;">
<tr>
<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #333333; color: white;"><strong>Component</strong></th>
<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #333333; color: white;"><strong>Technology</strong></th>
<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #333333; color: white;"><strong>Purpose</strong></th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Runtime</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Node.js + Express.js 5.x</td>
<td style="border: 1px solid #ddd; padding: 8px;">High-performance JavaScript runtime and web framework</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Database</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">MongoDB + Mongoose ODM</td>
<td style="border: 1px solid #ddd; padding: 8px;">Document database with schema validation</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Authentication</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">JWT + Passport.js + bcrypt</td>
<td style="border: 1px solid #ddd; padding: 8px;">Token-based auth with OAuth and password hashing</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Real-time Communication</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Socket.io</td>
<td style="border: 1px solid #ddd; padding: 8px;">WebSocket connections for live updates</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Security</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Helmet + CORS + Rate Limiting</td>
<td style="border: 1px solid #ddd; padding: 8px;">HTTP security headers and abuse prevention</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Validation</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Joi + Express Validator</td>
<td style="border: 1px solid #ddd; padding: 8px;">Input validation and schema enforcement</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Logging</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;">Winston + Morgan</td>
<td style="border: 1px solid #ddd; padding: 8px;">Structured logging with request tracking</td>
</tr>
</table>

## Enterprise Features

### **Advanced Authentication & Authorization**
- **Dual OAuth System** - Separate GitHub apps for authentication vs repository integration
- **JWT Token Management** - Secure authentication with automatic refresh and expiration
- **Role-Based Access Control** - User and admin roles with granular permissions
- **Multi-Provider OAuth** - GitHub, Google authentication with proper user linking
- **API Key Management** - Generate and manage API keys for programmatic access
- **Password Security** - bcrypt hashing with salt rounds and reset functionality

### **Enterprise Project Management**
- **GitHub Repository Integration** - Automatic framework detection and repository analysis
- **Multi-Stack Support** - MERN, Django, Flask with intelligent configuration
- **Atomic Project Creation** - Transaction-safe project creation with rollback mechanisms
- **Custom Subdomain Generation** - Unique project URLs with collision detection
- **Project Analytics** - Deployment metrics and performance tracking
- **Cascade Deletion Protection** - Prevents orphaned records with proper cleanup

### **AI-Powered Deployment Pipeline**
- **AI Review Integration** - Seamless integration with 6 AI models for code analysis
- **Deployment Worker Communication** - RESTful API for deployment job management
- **Real-Time Status Updates** - WebSocket-based live deployment progress
- **Environment Variable Injection** - AES-256 encrypted variable management
- **Deployment History** - Complete audit trail with status tracking
- **Rollback Mechanisms** - Transaction-safe deployment operations

### **Advanced Environment Management**
- **AES-256 Encryption** - All sensitive environment variables encrypted at rest
- **UPPER_SNAKE_CASE Validation** - Automatic format enforcement with duplicate detection
- **Secret Flagging** - Special handling for sensitive data with masked display
- **Runtime Injection** - Secure .env file generation for Docker containers
- **Transaction Safety** - MongoDB sessions with proper rollback handling
- **Variable Versioning** - Track changes and modifications over time

### **Enterprise Monitoring & Logging**
- **Structured Logging** - Winston-based logging with correlation IDs
- **Request Tracking** - Morgan middleware for HTTP request logging
- **Error Handling** - Global error handler with proper status codes
- **Health Checks** - System health endpoints for monitoring
- **Performance Metrics** - Response time tracking and resource utilization
- **Audit Trails** - Complete operation history for compliance

### **Production Security Features**
- **HTTP Security Headers** - Helmet.js for comprehensive security headers
- **CORS Configuration** - Proper cross-origin resource sharing setup
- **Rate Limiting** - Express rate limit for abuse prevention
- **Input Validation** - Joi schemas for all API endpoints
- **SQL Injection Prevention** - Mongoose ODM with parameterized queries
- **XSS Protection** - Input sanitization and output encoding

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

