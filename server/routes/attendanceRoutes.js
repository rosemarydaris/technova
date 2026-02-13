const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ================= MIDDLEWARE =================
// Verify JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contains id, email, domain
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Verify admin role - UPDATED TO CHECK isAdmin FIELD
const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= EMPLOYEE ROUTES =================
router.post("/check-in", authenticate, attendanceController.checkIn);
router.post("/check-out", authenticate, attendanceController.checkOut);
router.get("/my-attendance", authenticate, attendanceController.getMyAttendance);
router.get("/today", authenticate, attendanceController.getTodayStatus);

// ================= ADMIN ROUTES =================
router.get("/all", authenticate, verifyAdmin, attendanceController.getAllAttendance);
router.post("/mark", authenticate, verifyAdmin, attendanceController.markAttendance);
router.get("/summary", authenticate, verifyAdmin, attendanceController.getAttendanceSummary);

module.exports = router;

