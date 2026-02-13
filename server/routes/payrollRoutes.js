const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");
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
router.get("/my-payroll", authenticate, payrollController.getMyPayroll);

// ================= ADMIN ROUTES =================
// Calculate/Generate Payroll
router.post("/calculate", authenticate, verifyAdmin, payrollController.calculatePayroll);

// Get All Payrolls
router.get("/all", authenticate, verifyAdmin, payrollController.getAllPayrolls);

// Get Payroll Summary
router.get("/summary/monthly", authenticate, verifyAdmin, payrollController.getPayrollSummary);

// Get Single Payroll
router.get("/:id", authenticate, payrollController.getPayrollById);

// Update Payroll
router.put("/:id", authenticate, verifyAdmin, payrollController.updatePayroll);

// Delete Payroll
router.delete("/:id", authenticate, verifyAdmin, payrollController.deletePayroll);

// Mark as Paid
router.post("/:id/mark-paid", authenticate, verifyAdmin, payrollController.markAsPaid);

// Generate Payslip
router.post("/:id/generate-payslip", authenticate, verifyAdmin, payrollController.generatePayslip);


// Batch Calculate
router.post("/calculate-all", authenticate, verifyAdmin, payrollController.calculateAllPayroll);

// Download Payslip
router.get("/download/:filename", authenticate, verifyAdmin, payrollController.downloadPayslip);

module.exports = router;