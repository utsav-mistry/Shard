const express = require("express");
const {
    getSystemStats,
    getActiveDeployments,
    getSystemLogs,
    getWorkerStatus,
    getAIServiceStatus
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

module.exports = router;
