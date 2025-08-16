const express = require("express");
const { addEnvVar, getEnvVars, deleteEnvVar } = require("../controllers/envController");
const { authenticate } = require("../middleware/auth");

// Use authenticate as protect for consistency
const protect = authenticate;
const { validateEnvVar, sanitizeBody } = require("../utils/validation");

const router = express.Router();

// Protected: Add new env variable
router.post("/", protect, sanitizeBody, validateEnvVar, addEnvVar);

// Protected: Get all env vars for a project
router.get("/:projectId", protect, getEnvVars);

// Protected: Delete env variable
router.delete("/:id", protect, deleteEnvVar);

module.exports = router;
