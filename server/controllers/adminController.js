const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// GET all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const { domain } = req.query;
    const query = { isAdmin: false };

    if (domain) {
      // Case-insensitive exact match
      query.domain = { $regex: new RegExp(`^${domain}$`, 'i') };
    }

    const users = await User.find(query).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE employee
exports.updateEmployee = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Log the profile update
    if (updated) {
      await AuditLog.create({
        action: "PROFILE_UPDATE",
        userId: updated._id,
        userName: updated.fullName,
        details: `Profile updated by Admin (Fields: ${Object.keys(req.body).join(", ")})`,
        ip: req.ip || req.connection.remoteAddress,
        status: "Success"
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// DELETE employee
exports.deleteEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await User.findByIdAndDelete(req.params.id);

    // Log deletion
    if (user) {
      await AuditLog.create({
        action: "DELETE_USER",
        userId: user._id,
        userName: user.fullName || "Unknown", // user is deleted but we keep name
        details: `User deleted by Admin: ${user.email}`,
        ip: req.ip || req.connection.remoteAddress,
        status: "Success"
      });
    }

    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// GET Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

// GET Report Stats (KPIs)
exports.getReportStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentYear = parseInt(year) || new Date().getFullYear();
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;

    // 1. Total Employees (Excluding Admins)
    const totalEmployees = await User.countDocuments({ isAdmin: false });

    // 2. Present Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const presentToday = await require("../models/Attendance").countDocuments({
      date: today,
      status: "Present"
    });

    // 3. Pending Tasks
    const pendingTasks = await require("../models/Task").countDocuments({ status: "Pending" });

    // 4. Total Payroll (Net Salary) for selected Month
    const Payroll = require("../models/Payroll");
    const payrollStats = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, totalNetSalary: { $sum: "$netSalary" } } }
    ]);
    const totalPayroll = payrollStats.length > 0 ? payrollStats[0].totalNetSalary : 0;

    res.json({
      totalEmployees,
      presentToday,
      pendingTasks,
      totalPayroll
    });

  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
