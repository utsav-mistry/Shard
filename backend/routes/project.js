const express = require("express");
const { createProject, getProjects } = require("../controllers/projectController");
const { protect } = require("../utils/authMiddleware");
const { validateProject, sanitizeBody } = require("../utils/validation");

const router = express.Router();

router.post("/", protect, sanitizeBody, validateProject, createProject);
router.get("/", protect, getProjects);

module.exports = router;
