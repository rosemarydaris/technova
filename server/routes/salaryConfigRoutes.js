const express = require("express");
const router = express.Router();
const salaryConfigController = require("../controllers/salaryConfigController");
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
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Verify admin role
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
router.get("/my-config", authenticate, salaryConfigController.getMySalaryConfig);

// ================= ADMIN ROUTES =================
// Create Salary Configuration
router.post("/", authenticate, verifyAdmin, salaryConfigController.createSalaryConfig);

// Get All Salary Configurations
router.get("/all", authenticate, verifyAdmin, salaryConfigController.getAllSalaryConfigs);

// Get Salary Config by Employee ID
router.get("/employee/:employeeId", authenticate, verifyAdmin, salaryConfigController.getSalaryConfigByEmployee);

// Calculate Salary Breakdown
router.get("/employee/:employeeId/breakdown", authenticate, verifyAdmin, salaryConfigController.calculateSalaryBreakdown);

// Update Salary Configuration
router.put("/:id", authenticate, verifyAdmin, salaryConfigController.updateSalaryConfig);

// Delete Salary Configuration
router.delete("/:id", authenticate, verifyAdmin, salaryConfigController.deleteSalaryConfig);

module.exports = router;