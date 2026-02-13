const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// GET all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const users = await User.find().select("-password");
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
