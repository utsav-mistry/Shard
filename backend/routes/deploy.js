const express = require("express");
const { createDeployment, getDeployments, updateDeploymentStatus } = require("../controllers/deployController");
const { protect } = require("../utils/authMiddleware");
const { validateDeployment, sanitizeBody } = require("../utils/validation");

const router = express.Router();

router.post("/", protect, sanitizeBody, validateDeployment, createDeployment);

router.get("/", protect, getDeployments);

router.post("/update-status", sanitizeBody, updateDeploymentStatus);

module.exports = router;
