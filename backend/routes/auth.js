const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../utils/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/github/callback", authController.githubOAuthCallback);
router.post("/google/callback", authController.googleOAuthCallback);

// Protected routes - require authentication
router.get("/profile", protect, authController.getUserProfile);
router.put("/profile", protect, authController.updateUserProfile);

module.exports = router;
