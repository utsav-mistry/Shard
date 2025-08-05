const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/github/callback", authController.githubOAuthCallback);
router.post("/google/callback", authController.googleOAuthCallback);

module.exports = router;
