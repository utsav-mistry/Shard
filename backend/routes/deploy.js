const express = require("express");
const { createDeployment, getDeployments, updateDeploymentStatus } = require("../controllers/deployController");
const { authenticate } = require("../middleware/auth");
const { validateDeployment, sanitizeBody } = require("../utils/validation");

const router = express.Router();

// Use authenticate as protect for consistency
const protect = authenticate;

router.post("/", protect, sanitizeBody, validateDeployment, createDeployment);

router.get("/", protect, getDeployments);

router.post("/update-status", protect, sanitizeBody, updateDeploymentStatus);

module.exports = router;
