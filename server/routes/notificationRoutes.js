const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware to verify token
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

// Routes
router.post("/create", authenticate, notificationController.createNotification);
router.get("/all", authenticate, notificationController.getAllNotifications); // Admin history
router.get("/my-notifications", authenticate, notificationController.getMyNotifications); // Employee view
router.put("/:id/read", authenticate, notificationController.markAsRead);
router.delete("/:id", authenticate, notificationController.deleteNotification);

module.exports = router;
