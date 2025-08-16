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

// System monitoring endpoints
router.get("/stats", getSystemStats);
router.get("/deployments", getActiveDeployments);
router.get("/logs", getSystemLogs);
router.get("/worker/status", getWorkerStatus);
router.get("/ai-service/status", getAIServiceStatus);

// CRUD endpoints for Users
router.get("/users", getAllUsers);
router.put("/users/:id", sanitizeBody, updateUser);
router.delete("/users/:id", deleteUser);

// CRUD endpoints for Projects
router.get("/projects", getAllProjects);
router.put("/projects/:id", sanitizeBody, updateProject);
router.delete("/projects/:id", deleteProject);

// CRUD endpoints for Deployments
router.get("/all-deployments", getAllDeployments);
router.put("/deployments/:id", sanitizeBody, updateDeployment);
router.delete("/deployments/:id", deleteDeployment);

// Generic database CRUD endpoints
router.get("/db/tables", getTables);
router.get("/db/:tableName", getTableData);
router.post("/db/:tableName", sanitizeBody, createRecord);
router.put("/db/:tableName/:id", sanitizeBody, updateRecord);
router.delete("/db/:tableName/:id", deleteRecord);

module.exports = router;
