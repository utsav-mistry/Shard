/**
 * @swagger
 * components:
 *   schemas:
 *     SystemStats:
 *       type: object
 *       properties:
 *         memoryUsage:
 *           type: object
 *           properties:
 *             rss:
 *               type: number
 *             heapTotal:
 *               type: number
 *             heapUsed:
 *               type: number
 *             external:
 *               type: number
 *         uptime:
 *           type: number
 *           description: System uptime in seconds
 *         activeDeployments:
 *           type: number
 *         totalProjects:
 *           type: number
 *         totalUsers:
 *           type: number
 *     
 *     ServiceStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [online, offline, error]
 *         message:
 *           type: string
 *         lastChecked:
 *           type: string
 *           format: date-time
 *         responseTime:
 *           type: number
 *           description: Response time in milliseconds
 *     
 *     AdminUser:
 *       allOf:
 *         - $ref: '#/components/schemas/User'
 *         - type: object
 *           properties:
 *             lastLogin:
 *               type: string
 *               format: date-time
 *             loginCount:
 *               type: number
 *     
 *     DatabaseTable:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         count:
 *           type: number
 *         fields:
 *           type: array
 *           items:
 *             type: string
 * 
 * tags:
 *   - name: Admin
 *     description: Administrative operations (admin access required)
 */

const express = require("express");
const {
    getSystemStats,
    getActiveDeployments,
    getSystemLogs,
    getWorkerStatus,
    getAIServiceStatus,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllProjects,
    updateProject,
    deleteProject,
    getAllDeployments,
    updateDeployment,
    deleteDeployment,
    getTableData,
    createRecord,
    updateRecord,
    deleteRecord,
    getTables
} = require("../controllers/adminController");
const { authenticate, isAdmin } = require("../middleware/auth");

// Use authenticate as protect for consistency
const protect = authenticate;
const adminOnly = isAdmin;
const { sanitizeBody } = require("../utils/validation");

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Retrieve comprehensive system statistics including memory usage, uptime, and counts
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SystemStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
// System monitoring endpoints
router.get("/stats", getSystemStats);

/**
 * @swagger
 * /api/admin/deployments:
 *   get:
 *     summary: Get active deployments
 *     description: Retrieve all currently active deployments across the platform
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active deployments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Deployment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
router.get("/deployments", getActiveDeployments);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get system logs
 *     description: Retrieve system-wide logs for monitoring and debugging
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of log entries to retrieve
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Filter logs by level
 *     responses:
 *       200:
 *         description: System logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       level:
 *                         type: string
 *                       message:
 *                         type: string
 *                       meta:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
router.get("/logs", getSystemLogs);

/**
 * @swagger
 * /api/admin/worker/status:
 *   get:
 *     summary: Get deployment worker status
 *     description: Check the health and status of the deployment worker service
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServiceStatus'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
router.get("/worker/status", getWorkerStatus);

/**
 * @swagger
 * /api/admin/ai-service/status:
 *   get:
 *     summary: Get AI service status
 *     description: Check the health and status of the AI code review service
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServiceStatus'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
router.get("/ai-service/status", getAIServiceStatus);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users in the system with admin details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminUser'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
// CRUD endpoints for Users
router.get("/users", getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user information (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/AdminUser'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.put("/users/:id", sanitizeBody, updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user from the system (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", deleteUser);

/**
 * @swagger
 * /api/admin/projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve all projects in the system with admin details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of projects per page
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
// CRUD endpoints for Projects
router.get("/projects", getAllProjects);

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   put:
 *     summary: Update project
 *     description: Update project information (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Project not found
 */
router.put("/projects/:id", sanitizeBody, updateProject);

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     description: Delete a project from the system (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Project not found
 */
router.delete("/projects/:id", deleteProject);

/**
 * @swagger
 * /api/admin/all-deployments:
 *   get:
 *     summary: Get all deployments
 *     description: Retrieve all deployments in the system with admin details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of deployments per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, failed]
 *         description: Filter by deployment status
 *     responses:
 *       200:
 *         description: Deployments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Deployment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
// CRUD endpoints for Deployments
router.get("/all-deployments", getAllDeployments);

/**
 * @swagger
 * /api/admin/deployments/{id}:
 *   put:
 *     summary: Update deployment
 *     description: Update deployment information (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deployment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDeploymentStatusRequest'
 *     responses:
 *       200:
 *         description: Deployment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Deployment updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Deployment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Deployment not found
 */
router.put("/deployments/:id", sanitizeBody, updateDeployment);

/**
 * @swagger
 * /api/admin/deployments/{id}:
 *   delete:
 *     summary: Delete deployment
 *     description: Delete a deployment from the system (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deployment ID
 *     responses:
 *       200:
 *         description: Deployment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Deployment deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Deployment not found
 */
router.delete("/deployments/:id", deleteDeployment);

/**
 * @swagger
 * /api/admin/db/tables:
 *   get:
 *     summary: Get database tables
 *     description: Retrieve list of all database tables and their metadata
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database tables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DatabaseTable'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
// Generic database CRUD endpoints
router.get("/db/tables", getTables);

/**
 * @swagger
 * /api/admin/db/{tableName}:
 *   get:
 *     summary: Get table data
 *     description: Retrieve all records from a specific database table
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the database table
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Table data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Table not found
 */
router.get("/db/:tableName", getTableData);

/**
 * @swagger
 * /api/admin/db/{tableName}:
 *   post:
 *     summary: Create database record
 *     description: Create a new record in the specified database table
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the database table
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Record data (varies by table)
 *     responses:
 *       201:
 *         description: Record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Record created successfully
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
router.post("/db/:tableName", sanitizeBody, createRecord);

/**
 * @swagger
 * /api/admin/db/{tableName}/{id}:
 *   put:
 *     summary: Update database record
 *     description: Update an existing record in the specified database table
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the database table
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Updated record data (varies by table)
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Record updated successfully
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Record not found
 */
router.put("/db/:tableName/:id", sanitizeBody, updateRecord);

/**
 * @swagger
 * /api/admin/db/{tableName}/{id}:
 *   delete:
 *     summary: Delete database record
 *     description: Delete a record from the specified database table
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the database table
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Record deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Record not found
 */
router.delete("/db/:tableName/:id", deleteRecord);

module.exports = router;
