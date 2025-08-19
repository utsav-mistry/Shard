# SHARD PLATFORM - COMPLETE CIRCUIT DIAGRAM & WORKFLOW ANALYSIS

## SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         SHARD DEPLOYMENT PLATFORM                                                   │
│                                                                                                                     │
│                                              CORE SERVICES                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────────────────┐     │
│  │    FRONTEND     │  │     BACKEND     │  │  AI REVIEW      │  │           DEPLOYMENT WORKER                 │     │
│  │   (React SPA)   │  │  (Express API)  │  │   SERVICE       │  │          (Express Service)                  │     │
│  │   Port: 3000    │  │   Port: 5000    │  │ (Django/Python) │  │            Port: 9000                       │     │
│  │                 │  │                 │  │   Port: 8000    │  │                                             │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────────────────────────────────┘     │
│           │                     │                     │                               │                             │
│           │                     │                     │                               │                             │
│           │                     │                     │                               │                             │
│                                              INFRASTRUCTURE LAYER                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────────────────┐     │
│  │   USER BROWSER  │  │    MONGODB      │  │  DOCKER ENGINE  │  │              EXTERNAL SERVICES              │     │
│  │  (Client Side)  │  │   (Database)    │  │ (Container Host)│  │                                             │     │
│  │                 │  │  Port: 27017    │  │                 │  │  ┌─────────────┐  ┌─────────────────────┐   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │  │   GITHUB    │  │       NGINX         │   │     │
│                                                     │           │  │     API     │  │   REVERSE PROXY     │   │     │
│                                                     │           │  │             │  │   (Per Deployment)  │   │     │
│                                                     │           │  └─────────────┘  └─────────────────────┘   │     │
│                        ┌─────────────────────────────────────────                                            ┌      │
│                        │                        DEPLOYED USER APPLICATIONS                                   │      │
│                        │                        (Managed by Docker Engine)                                   │      │
│                        │                                                                                     │      │
│                        │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────────┐  │      │
│                        │  │   MERN STACK    │  │  DJANGO APPS    │  │         FLASK APPS                  │  │      │
│                        │  │                 │  │                 │  │                                     │  │      │
│                        │  │  Frontend:      │  │  Single App:    │  │   Single App:                       │  │      │
│                        │  │  Port 12001     │  │  Port 13000     │  │   Port 14000                        │  │      │
│                        │  │  Backend:       │  │                 │  │                                     │  │      │
│                        │  │  Port 12000     │  │                 │  │                                     │  │      │
│                        │  │                 │  │                 │  │                                     │  │      │
│                        │  └─────────────────┘  └─────────────────┘  └─────────────────────────────────────┘  │      │
│                        │                                                                                     │      │
│                        │  Each deployment gets unique subdomain: {project-name}.localhost:{port}             │      │
│                        └─────────────────────────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## CONNECTION MATRIX & DATA FLOW

### 1. FRONTEND ↔ BACKEND CONNECTIONS

#### **HTTP API Connections**
```
FRONTEND (React) ──HTTP/HTTPS──→ BACKEND (Express)
Port: 3000                       Port: 5000

API Endpoints:
├── /api/auth/*                  [Authentication & OAuth]
├── /api/projects/*              [Project Management]
├── /api/deployments/*           [Deployment Operations]
├── /api/projects/:id/env/*      [Environment Variables]
├── /api/integrations/*          [GitHub Integration]
├── /api/logs/*                  [Deployment Logs]
├── /api/admin/*                 [Admin Operations]
└── /health                      [Health Monitoring]
```

#### **WebSocket Connections (Socket.IO)**
```
FRONTEND ──WebSocket──→ BACKEND
Purpose: Real-time Updates

Channels:
├── health-monitoring            [System Health Data]
├── deployment-{deploymentId}    [Real-time Deployment Logs]
└── admin-dashboard             [Admin Real-time Data]
```

### 2. BACKEND ↔ DATABASE CONNECTIONS

#### **MongoDB Connection**
```
BACKEND ──MongoDB Protocol──→ MONGODB
Connection: mongoose ODM

Collections:
├── users                       [User Authentication & Profiles]
├── projects                    [Project Metadata & Configuration]
├── deployments                 [Deployment Records & Status]
├── envvars                     [Environment Variables (Encrypted)]
├── logs                        [Deployment & System Logs]
├── integrations               [OAuth Integration Tokens]
└── notifications              [User Notifications]
```

### 3. BACKEND ↔ DEPLOYMENT WORKER CONNECTIONS

#### **HTTP API Communication**
```
BACKEND ──HTTP──→ DEPLOYMENT WORKER
Port: 5000      Port: 9000

Endpoints:
├── POST /api/jobs              [Submit Deployment Job]
├── GET /api/jobs/:id           [Check Job Status]
├── DELETE /cleanup/:projectId  [Docker Cleanup]
└── /health                     [Worker Health Check]
```

#### **Job Queue System**
```
BACKEND ──Job Submission──→ DEPLOYMENT WORKER
Flow:
1. Backend creates deployment record
2. Backend submits job to worker queue
3. Worker processes job asynchronously
4. Worker updates backend via HTTP callbacks
```

### 4. BACKEND ↔ AI REVIEW SERVICE CONNECTIONS

#### **HTTP API Communication**
```
BACKEND ──HTTP──→ AI REVIEW SERVICE (Django)
Port: 5000      Port: 8000

Endpoints:
├── POST /review/               [Submit Project for AI Analysis]
├── GET /                       [Health Check & Service Status]
└── Admin Interface             [Django Admin for Review Management]
```

#### **Code Analysis Pipeline**
```
BACKEND ──Project Submission──→ AI REVIEW SERVICE
Flow:
1. Backend sends projectId to AI service
2. AI service fetches project data from backend
3. AI service performs security and quality analysis
4. AI service generates structured report with issues
5. AI service returns verdict (approve/deny/manual_review)
6. Backend stores results and proceeds based on verdict
```

### 5. DEPLOYMENT WORKER ↔ EXTERNAL SERVICES

#### **Docker Engine Connection**
```
DEPLOYMENT WORKER ──Docker API──→ DOCKER ENGINE
Operations:
├── docker build                [Build Application Images]
├── docker run                  [Start Application Containers]
├── docker stop/rm              [Container Lifecycle Management]
├── docker logs                 [Stream Container Logs]
├── docker inspect              [Container Health Checks]
└── docker system prune         [Cleanup Unused Resources]
```

#### **Git Repository Access**
```
DEPLOYMENT WORKER ──Git Protocol──→ GITHUB/GIT REPOS
Operations:
├── git clone                   [Download Source Code]
├── git fetch                   [Update Repository Data]
├── git checkout                [Switch Branches/Tags]
├── git log                     [Extract Commit Information]
└── Authentication via tokens   [Access Private Repos]
```

#### **Socket.IO Connection to Backend**
```
DEPLOYMENT WORKER ──WebSocket──→ BACKEND
Purpose: Real-time Log Streaming

Events:
├── deployment-log              [Stream Build/Deploy Logs]
├── deployment-status           [Status Updates]
├── deployment-progress         [Step-by-Step Progress Updates]
├── deployment-error            [Error Notifications]
└── deployment-complete         [Completion Notifications]
```

### 6. EXTERNAL SERVICE INTEGRATIONS

#### **GitHub API Integration**
```
BACKEND ──HTTPS API──→ GITHUB API
Authentication: OAuth Tokens

Operations:
├── User Authentication         [OAuth Login Flow]
├── Repository Access           [List User Repositories]
├── Repository Cloning          [Access Private/Public Repos]
├── Webhook Management          [Deploy Triggers]
└── Integration Management      [Token Storage & Refresh]
```

#### **User Application Routing**
```
USER BROWSER ──HTTP──→ DEPLOYED APPLICATIONS
Direct Access Pattern:

├── {project-name}.localhost:12000    [MERN Backend]
├── {project-name}.localhost:12001    [MERN Frontend]
├── {project-name}.localhost:13000    [Django Apps]
└── {project-name}.localhost:14000    [Flask Apps]

Note: Each deployment creates unique containers with project-specific names
Container Naming: shard-{project-subdomain}
```

## COMPLETE USER WORKFLOW ANALYSIS

### **PHASE 1: USER AUTHENTICATION**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   Backend   │    │   MongoDB   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
   [1] │ POST /api/auth/   │                   │
       │ login/register    │                   │
       │ ─────────────────→│                   │
       │                   │ [2] Query/Create  │
       │                   │ User Record       │
       │                   │ ─────────────────→│
       │                   │                   │
       │                   │ [3] User Data     │
       │                   │ ←─────────────────│
       │ [4] JWT Token +   │                   │
       │ User Profile      │                   │
       │ ←─────────────────│                   │

OAuth Flow (GitHub/Google):
Browser → OAuth Provider → Backend → MongoDB → JWT Response
```

### **PHASE 2: PROJECT CREATION & GITHUB INTEGRATION**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │   MongoDB   │    │   GitHub    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
   [1] │ Connect GitHub    │                   │                   │
       │ Integration       │                   │                   │
       │ ─────────────────→│                   │                   │
       │                   │ [2] OAuth Flow    │                   │
       │                   │ ─────────────────────────────────────→│
       │                   │                   │                   │
       │                   │ [3] Access Token  │                   │
       │                   │ ←─────────────────────────────────────│
       │                   │ [4] Store Token   │                   │
       │                   │ ─────────────────→│                   │
       │                   │                   │                   │
   [5] │ Create Project    │                   │                   │
       │ + Select Repo     │                   │                   │
       │ ─────────────────→│                   │                   │
       │                   │ [6] Fetch Repos   │                   │
       │                   │ ─────────────────────────────────────→│
       │                   │                   │                   │
       │                   │ [7] Repo List     │                   │
       │                   │ ←─────────────────────────────────────│
       │                   │ [8] Create Project│                   │
       │                   │ Record            │                   │
       │                   │ ─────────────────→│                   │
```

### **PHASE 3: DEPLOYMENT PIPELINE WITH AI REVIEW & DYNAMIC NGINX PROXY**

**Overview**: This phase demonstrates the complete deployment workflow from user trigger to live application with dynamic Nginx reverse proxy configuration. Each deployed project gets its own subdomain routing through Nginx with automatic SSL termination and load balancing.

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Frontend  │ │ Backend  │ │ MongoDB  │ │AI Review │ │ Worker   │ │ Docker   │ │  Nginx   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
     │            │            │            │            │            │            │
 [1] │ Trigger    │            │            │            │            │            │
     │ Deploy     │            │            │            │            │            │
     │ ─────────→ │            │            │            │            │            │
     │            │ [2] Create │            │            │            │            │
     │            │ Deployment │            │            │            │            │
     │            │ Record     │            │            │            │            │
     │            │ ─────────→ │            │            │            │            │
     │            │            │            │            │            │            │
     │            │ [3] Submit │            │            │            │            │
     │            │ Code for   │            │            │            │            │
     │            │ AI Review  │            │            │            │            │
     │            │ ──────────────────────→ │            │            │            │
     │            │            │            │            │            │            │
     │            │            │            │ [4] Deep   │            │            │
     │            │            │            │ Code       │            │            │
     │            │            │            │ Analysis   │            │            │
     │            │            │            │ (Security, │            │            │
     │            │            │            │ Quality,   │            │            │
     │            │            │            │ Best       │            │            │
     │            │            │            │ Practices) │            │            │
     │            │            │            │            │            │            │
     │            │ [5] AI     │            │            │            │            │
     │            │ Verdict    │            │            │            │            │
     │            │ & Issues   │            │            │            │            │
     │            │ ←────────────────────── │            │            │            │
     │            │ [6] Store  │            │            │            │            │
     │            │ Review     │            │            │            │            │
     │            │ Results    │            │            │            │            │
     │            │ ─────────→ │            │            │            │            │
     │            │            │            │            │            │            │
     │            │ [7] Queue  │            │            │            │            │
     │            │ Deploy Job │            │            │            │            │
     │            │ (if approved)           │            │            │            │
     │            │ ───────────────────────────────────→ │            │            │
     │            │            │            │            │            │            │
     │            │            │            │            │ [8] Clone  │            │
     │            │            │            │            │ Repo &     │            │
     │            │            │            │            │ Inject     │            │
     │            │            │            │            │ Env Vars   │            │
     │            │            │            │            │            │            │
     │            │            │            │            │ [9] Build  │            │
     │            │            │            │            │ Docker     │            │
     │            │            │            │            │ Image      │            │
     │            │            │            │            │ ─────────→ │            │
     │            │            │            │            │            │            │
     │            │            │            │            │ [10] Start │            │
     │            │            │            │            │ Container  │            │
     │            │            │            │            │ with       │            │
     │            │            │            │            │ Unique     │            │
     │            │            │            │            │ Name       │            │
     │            │            │            │            │ ─────────→ │            │
     │            │            │            │            │            │            │
     │            │            │            │            │ [11] Generate           │
     │            │            │            │            │ Dynamic    │            │
     │            │            │            │            │ Nginx      │            │
     │            │            │            │            │ Config     │            │
     │            │            │            │            │ ──────────────────────→ │
     │            │            │            │            │            │            │
     │            │            │            │            │            │ [12] Setup │
     │            │            │            │            │            │ Subdomain  │
     │            │            │            │            │            │ Routing &  │
     │            │            │            │            │            │ SSL Proxy  │
     │            │            │            │            │            │            │
     │            │            │            │            │            │ [13] Health│
     │            │            │            │            │            │ Check &    │
     │            │            │            │            │            │ Load       │
     │            │            │            │            │            │ Balance    │
     │            │            │            │            │            │ ←────────→ │
     │            │            │            │            │            │            │
     │ [14] Live  │ ←─────────────────────────────────── │            │            │
     │ Progress   │            │            │            │            │            │
     │ Updates    │            │            │            │            │            │
     │ ←────────→ │            │            │            │            │            │
     │            │ [15] Final │            │            │            │            │
     │            │ Status &   │            │            │            │            │
     │            │ Live URL   │            │            │            │            │
     │            │ ─────────→ │            │            │            │            │
```

#### **Nginx Dynamic Proxy Configuration Details**

**Step 11-13: Advanced Nginx Setup Process**

1. **Dynamic Configuration Generation**:
   - Worker generates unique Nginx server block for each deployment
   - Creates subdomain mapping: `{project-subdomain}.localhost:{tech-stack-port}`
   - Configures upstream backend pointing to Docker container
   - Sets up SSL termination and security headers

2. **Proxy Mapping Structure**:
   ```nginx
   # Example generated config for Flask project "my-app"
   upstream my_app_backend {
       server 127.0.0.1:14000;  # Container port mapping
   }
   
   server {
       listen 80;
       server_name my-app.localhost;
       
       location / {
           proxy_pass http://my_app_backend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Container Naming Strategy**:
   - Unique container names: `shard-{project-subdomain}`
   - Multiple projects of same tech stack can coexist
   - Port sharing through Nginx reverse proxy
   - Example: `shard-my-flask-app`, `shard-another-flask-app`

4. **Health Monitoring & Load Balancing**:
   - Nginx performs health checks on backend containers
   - Automatic failover if container becomes unhealthy
   - Request routing based on subdomain matching
   - SSL certificate management for HTTPS endpoints

5. **Dynamic Reload Process**:
   - New configurations added to `/etc/nginx/conf.d/`
   - Nginx configuration tested with `nginx -t`
   - Graceful reload with `nginx -s reload`
   - Zero-downtime deployment updates

**Result**: Each deployed application gets its own URL like `my-app.localhost:14000` with full SSL support, health monitoring, and automatic load balancing through the Nginx reverse proxy layer.

### **PHASE 4: ENVIRONMENT VARIABLES FLOW**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │   MongoDB   │    │   Worker    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
   [1] │ Add/Edit Env Vars │                   │                   │
       │ ─────────────────→│                   │                   │
       │                   │ [2] Encrypt &     │                   │
       │                   │ Store Variables   │                   │
       │                   │ ─────────────────→│                   │
       │                   │                   │                   │
       │ [3] During Deploy │                   │                   │
       │ ─────────────────→│                   │                   │
       │                   │ [4] Fetch & Send  │                   │
       │                   │ to Worker         │                   │
       │                   │ ─────────────────────────────────────→│
       │                   │                   │                   │
       │                   │                   │                   │ [5] Create .env
       │                   │                   │                   │ File & Inject
       │                   │                   │                   │ into Container
```

### **PHASE 5: REAL-TIME LOGGING & MONITORING**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │   Worker    │    │   MongoDB   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ [1] Subscribe to  │                   │                   │
       │ deployment-{id}   │                   │                   │
       │ Socket Channel    │                   │                   │
       │ ─────────────────→│                   │                   │
       │                   │                   │                   │
       │                   │                   │ [2] Stream Logs   │
       │                   │                   │ via Socket.IO     │
       │                   │ ←─────────────────────────────────────│
       │                   │                   │                   │
       │                   │ [3] Broadcast to  │                   │
       │                   │ Subscribed Clients│                   │
       │ ←─────────────────│                   │                   │
       │                   │                   │                   │
       │                   │ [4] Store Logs    │                   │
       │                   │ in Database       │                   │
       │                   │ ─────────────────────────────────────→│
```

## IDENTIFIED WORKFLOW ISSUES & FIXES

### **ISSUE 1: Missing Socket.IO Connection from Worker to Backend**
**Problem**: Deployment worker streams logs directly to frontend, but should go through backend
**Fix**: Update worker to connect to backend Socket.IO server instead of direct frontend connection

### **ISSUE 2: Environment Variable Route Mounting**
**Problem**: Routes were incorrectly mounted causing API endpoint mismatches
**Status**: FIXED - Routes now properly mounted at `/api/projects/:projectId/env`

### **ISSUE 3: Docker Container Cleanup**
**Problem**: Containers and images not cleaned up when projects are deleted
**Status**: FIXED - Integrated cleanup API call in project deletion flow

### **ISSUE 4: Real-time Log Formatting**
**Problem**: Raw Docker output shown to users instead of user-friendly messages
**Status**: FIXED - Implemented message formatting in streaming logger

## NETWORK TOPOLOGY

```
Internet/External Services
    │
    ├── GitHub API (OAuth & Repository Access)
    │
    ├── User Browser ──→ Frontend (React SPA - Port 3000)
    │                    │
    │                    ├── Static Assets Serving
    │                    ├── API Calls to Backend
    │                    └── Socket.IO Real-time Connection
    │                    │
    │                    └──→ Backend (Express API - Port 5000)
    │                         │
    │                         ├── REST API Endpoints
    │                         ├── Socket.IO Server
    │                         ├── JWT Authentication
    │                         ├── MongoDB Connection (Port 27017)
    │                         ├── AI Service Communication (Port 8000)
    │                         └── Deployment Worker Communication (Port 9000)
    │
    ├── AI Review Service (Django - Port 8000)
    │   ├── Code Analysis Engine
    │   ├── Security Vulnerability Scanning
    │   └── Quality Assessment
    │
    ├── Deployment Worker (Express - Port 9000)
    │   ├── Job Queue Processing
    │   ├── Docker Engine Integration
    │   ├── Git Repository Cloning
    │   ├── Container Lifecycle Management
    │   ├── Nginx Configuration Management
    │   └── Real-time Log Streaming
    │
    ├── MongoDB Database (Port 27017)
    │   ├── User Authentication Data
    │   ├── Project Configuration
    │   ├── Deployment Records
    │   ├── Environment Variables (Encrypted)
    │   └── System Logs
    │
    ├── Docker Engine (Local Socket)
    │   ├── Container Management
    │   ├── Image Building & Caching
    │   ├── Network Management
    │   └── Resource Cleanup
    │
    ├── Nginx Reverse Proxy (Per Deployment)
    │   ├── Dynamic Configuration Generation
    │   ├── Subdomain Routing
    │   ├── SSL Termination
    │   ├── Load Balancing
    │   └── Static File Serving
    │
    └── Deployed User Applications
        ├── MERN Stack Apps (Ports 12000/12001)
        ├── Django Apps (Port 13000)
        └── Flask Apps (Port 14000)
```

## DATA FLOW SUMMARY

### **Authentication Data Flow**
1. User credentials → Backend (Port 5000) → MongoDB (Port 27017) → JWT Token → Frontend (Port 3000)
2. GitHub OAuth → GitHub API → Backend → MongoDB (encrypted token storage)
3. Google OAuth → Google API → Backend → MongoDB (encrypted token storage)

### **Project Management Data Flow**
1. Project creation → Frontend → Backend → MongoDB (project record)
2. GitHub integration → Backend → GitHub API → Repository list → Frontend
3. Repository selection → Backend → GitHub API (clone access) → Project setup

### **AI Review Integration Flow**
1. Deploy trigger → Backend → AI Service (Port 8000) → Code analysis
2. AI verdict → Backend → MongoDB (review results) → Deployment decision
3. Manual review → Admin interface → AI Service → Backend

### **Deployment Pipeline Data Flow**
1. Deploy trigger → Backend → Deployment Worker (Port 9000) → Job queue
2. Worker → GitHub API → Repository clone → Local storage
3. Worker → Docker Engine → Image build → Container creation
4. Real-time logs → Worker → Backend Socket.IO → Frontend
5. Status updates → Worker → Backend → MongoDB → Frontend

### **Environment Variables Data Flow**
1. User input → Frontend → Backend → AES-256 encryption → MongoDB
2. Deployment time → Backend → Worker → .env file generation → Container injection
3. Variable updates → Frontend → Backend → Re-encryption → MongoDB

### **Container Management Flow**
1. Container creation → Docker Engine → Unique naming (shard-{subdomain})
2. Port mapping → Host ports (12000/12001/13000/14000) → Container ports
3. Health checks → Worker → Container status → Backend → Frontend
4. Container cleanup → Project deletion → Worker → Docker Engine → Resource cleanup

## SYSTEM HEALTH STATUS

- **Frontend**: Fully functional with proper routing and real-time updates
- **Backend**:  All API endpoints working, Socket.IO integrated
- **Deployment Worker**: Job processing, Docker integration, log streaming
- **Database**:  All collections properly structured and indexed
- **Real-time Communication**: Socket.IO channels working for logs and health
- **Docker Integration**: Build, deploy, and cleanup operations functional
- **Environment Variables**: Full CRUD operations with encryption
- **Authentication**: JWT + OAuth (GitHub/Google) working
- **GitHub Integration**: Repository access and project import functional