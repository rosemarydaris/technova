const Task = require("../models/Task");
const User = require("../models/User");

// ================== Employee Routes ==================

// GET /api/tasks/my-tasks - Fetch tasks assigned to logged-in employee
exports.getMyTasks = async (req, res) => {
  try {
    const email = req.user.email;

    const tasks = await Task.find({ assignedTo: email })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// PUT /api/tasks/:id - Update task status, add comment, or upload file
exports.updateTask = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const email = req.user.email;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check authorization
    if (task.assignedTo !== email && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    // Update status
    if (status) {
      task.status = status;
      if (status === "Completed" && !task.completedAt) {
        task.completedAt = new Date();
      }
    }

    // Add comment
    if (comment && comment.trim()) {
      if (!task.comments) task.comments = [];
      task.comments.push({
        text: comment.trim(),
        addedBy: email,
        addedAt: new Date()
      });
    }

    // Handle File Upload (Work submission)
    if (req.file) {
      if (!task.attachments) task.attachments = [];
      task.attachments.push({
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: email
      });
    }

    await task.save();
    res.json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Task update failed" });
  }
};

// GET /api/tasks/stats - Get task statistics for employee
exports.getTaskStats = async (req, res) => {
  try {
    const email = req.user.email;

    const [total, pending, inProgress, completed] = await Promise.all([
      Task.countDocuments({ assignedTo: email }),
      Task.countDocuments({ assignedTo: email, status: "Pending" }),
      Task.countDocuments({ assignedTo: email, status: "In Progress" }),
      Task.countDocuments({ assignedTo: email, status: "Completed" })
    ]);

    res.json({ total, pending, inProgress, completed });
  } catch (error) {
    console.error("Error fetching task stats:", error);
    res.status(500).json({ message: "Failed to fetch task statistics" });
  }
};

// ================== Admin Routes ==================

// POST /api/tasks - Admin assigns a task
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, domain } = req.body;

    if (!title || !description || !assignedTo) {
      return res.status(400).json({
        message: "Title, description, and assignedTo are required"
      });
    }

    // Verify employee exists
    const employee = await User.findOne({ email: assignedTo.toLowerCase() });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const newTask = new Task({
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignedTo.toLowerCase(),
      assignedBy: req.user?.email || "admin@technova.com", // Fallback for safety
      domain: domain || employee.domain || "General",
      priority: priority || "Medium",
      dueDate: dueDate || null,
      status: "Pending",
      comments: [],
      attachments: []
    });

    if (req.file) {
      newTask.attachments.push({
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedBy: req.user?.email || "admin@technova.com"
      });
    }

    await newTask.save();

    res.status(201).json({
      message: "Task created successfully",
      task: newTask
    });
  } catch (error) {
    console.error("❌ Error in createTask controller:", error);
    res.status(500).json({
      message: "Failed to create task",
      error: error.message
    });
  }
};


// GET /api/tasks/admin/:email - Get tasks of specific employee
exports.getTasksByEmployee = async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();

    const tasks = await Task.find({ assignedTo: email })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// GET /api/tasks/all - Get all tasks (admin only)
exports.getAllTasks = async (req, res) => {
  try {
    const { domain } = req.query;

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "assignedTo", // field in Task (email string)
          foreignField: "email",    // field in User (email string)
          as: "assigneeDetails"
        }
      },
      {
        $unwind: {
          path: "$assigneeDetails",
          preserveNullAndEmptyArrays: true // keep task even if user not found
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          status: 1,
          priority: 1,
          dueDate: 1,
          createdAt: 1,
          completedAt: 1,
          // We project the Full Object for assignedTo
          assignedTo: {
            // If user found, use it; else fallback to email string
            $ifNull: ["$assigneeDetails", { email: "$assignedTo", fullName: "Unknown", domain: "N/A" }]
          },
          assignedBy: 1,
          domain: 1, // Keep original domain if needed, but we prefer user domain usually?
          // Don't need password

        }
      },
      { $sort: { createdAt: -1 } }
    ];

    // Filter by Domain (either Task domain or User domain)
    if (domain) {
      const regex = new RegExp(`^${domain}$`, 'i');
      pipeline.push({
        $match: {
          $or: [
            { "assignedTo.domain": { $regex: regex } },
            { domain: { $regex: regex } }
          ]
        }
      });
    }

    const tasks = await Task.aggregate(pipeline);

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// DELETE /api/tasks/:id - Delete a task (admin only)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

// PUT /api/tasks/admin/:id - Admin updates any task
exports.adminUpdateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, domain } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (title) task.title = title.trim();
    if (description) task.description = description.trim();
    if (status) {
      task.status = status;
      if (status === "Completed" && !task.completedAt) {
        task.completedAt = new Date();
      }
    }
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (domain) task.domain = domain;

    await task.save();
    res.json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
};

// GET /api/tasks/reports - Admin Reports
exports.getTaskReports = async (req, res) => {
  try {
    // 1. Total Stats
    const totalStats = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {
      Pending: 0,
      "In Progress": 0,
      Completed: 0
    };
    totalStats.forEach(s => statsMap[s._id] = s.count);

    // 2. Employee Performance
    const employeePerformance = await Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          email: "$_id",
          total: 1,
          completed: 1,
          pending: 1,
          completionRate: {
            $multiply: [{ $divide: ["$completed", "$total"] }, 100]
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    res.json({
      overview: statsMap,
      employees: employeePerformance
    });

  } catch (error) {
    console.error("Error generating reports:", error);
    res.status(500).json({ message: "Failed to generate reports" });
  }
};