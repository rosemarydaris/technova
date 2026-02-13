const express = require("express");
const router = express.Router();
const {
  getMyTasks,
  updateTask,
  getTaskStats,
  createTask,
  getTasksByEmployee,
  getAllTasks,
  deleteTask,
  adminUpdateTask,
  getTaskReports
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/taskUpload");

// ====== Employee Routes ======
// These routes are accessible to all authenticated users
router.get("/my-tasks", authMiddleware, getMyTasks);       // View own tasks
router.get("/stats", authMiddleware, getTaskStats);        // Get task statistics
router.put("/:id", authMiddleware, upload.single("file"), updateTask); // Update task status/add comment/upload file

// ====== Admin Routes ======
// These routes require admin privileges
router.get("/reports", authMiddleware, adminMiddleware, getTaskReports);          // Get Task Reports
router.post("/", authMiddleware, adminMiddleware, upload.single("file"), createTask); // Create/assign new task
router.get("/all", authMiddleware, adminMiddleware, getAllTasks);                 // Get all tasks
router.get("/admin/:email", authMiddleware, adminMiddleware, getTasksByEmployee); // Get tasks by employee
router.put("/admin/:id", authMiddleware, adminMiddleware, adminUpdateTask);       // Admin update any task
router.delete("/:id", authMiddleware, adminMiddleware, deleteTask);               // Delete task

module.exports = router;