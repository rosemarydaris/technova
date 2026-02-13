const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");


dotenv.config();

const app = express();

// ========================================
// CORS - MUST BE ABSOLUTELY FIRST
// ========================================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request handled for:', req.url);
    return res.status(204).end();
  }

  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ========================================
// Body Parser
// ========================================
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ========================================
// Routes
// ========================================
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

const employeeRoutes = require("./routes/employeeRoutes");
app.use("/api/employees", employeeRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// ⭐ NEW: Attendance Routes
const attendanceRoutes = require("./routes/attendanceRoutes");
app.use("/api/attendance", attendanceRoutes);


// ⭐ NEW: Payroll Routes
const payrollRoutes = require("./routes/payrollRoutes");
app.use("/api/payroll", payrollRoutes);

// ⭐ NEW: Salary Configuration Routes
const salaryConfigRoutes = require("./routes/salaryConfigRoutes");
app.use("/api/salary-config", salaryConfigRoutes);

// ⭐ NEW: Notification Routes
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// ⭐ NEW: Leave Routes
const leaveRoutes = require("./routes/leaveRoutes");
app.use("/api/leave", leaveRoutes);

// ⭐ NEW: Employee Details Routes
const employeeDetailsRoutes = require("./routes/employeeDetailsRoutes");
app.use("/api/employee-details", employeeDetailsRoutes);


const attendanceController = require("./controllers/attendanceController");


// ========================================
// MongoDB Connection
// ========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ========================================
// Start Server
// ========================================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Accepting requests from http://localhost:5173`);
});