// employeeDetailsRoutes.js
const express = require("express");
const router = express.Router();
const employeeDetailsController = require("../controllers/employeeDetailsController");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware to verify JWT
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

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
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

// Employee Routes
router.post("/submit", authenticate, employeeDetailsController.submitEmployeeDetails);
router.get("/me", authenticate, employeeDetailsController.getMyDetails);

// Admin Routes
router.get("/all", authenticate, isAdmin, employeeDetailsController.getAllEmployeeDetails);
router.get("/:id", authenticate, isAdmin, employeeDetailsController.getEmployeeDetailsById);
router.get("/user/:userId", authenticate, isAdmin, employeeDetailsController.getEmployeeDetailsByUserId);

module.exports = router;
