const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus,
    getLeaveBalance,
    deleteLeave
} = require("../controllers/leaveController");

// Employee Routes
router.post("/apply", protect, applyLeave);
router.get("/my-leaves", protect, getMyLeaves);
router.get("/balance", protect, getLeaveBalance);

// Admin Routes
router.get("/all", protect, admin, getAllLeaves);
router.put("/:id/status", protect, admin, updateLeaveStatus);
router.delete("/:id", protect, admin, deleteLeave);

module.exports = router;
