// authRoutes.js - Make sure the path is correct
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");  // Check this path

const { registerUser, loginUser, getProfilePicture } = require("../controllers/authController");

// Register route with multer middleware for file upload
router.post("/register", upload.single("profilePic"), registerUser);

// Login route
router.post("/login", loginUser);

// Get profile picture route
router.get("/profile-pic/:id", getProfilePicture);

module.exports = router;