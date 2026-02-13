const Leave = require("../models/Leave");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// ================= APPLY FOR LEAVE =================
exports.applyLeave = async (req, res) => {
    try {
        const { startDate, endDate, leaveType, reason } = req.body;
        const employeeId = req.user.id;

        if (!startDate || !endDate || !leaveType || !reason) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const leave = new Leave({
            employeeId,
            startDate,
            endDate,
            leaveType,
            reason
        });

        await leave.save();

        await AuditLog.create({
            action: "LEAVE_APPLIED",
            userId: employeeId,
            userName: req.user.email, // Using email as name might not be available in token sometimes, better fetch user if needed, but token has id
            details: `Applied for ${leaveType} leave from ${startDate} to ${endDate}`,
            ip: req.ip,
            status: "Success"
        });

        res.status(201).json({ message: "Leave application submitted successfully", leave });
    } catch (err) {
        console.error("❌ APPLY LEAVE ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ================= GET MY LEAVES =================
exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ employeeId: req.user.id }).sort({ appliedOn: -1 });
        res.status(200).json(leaves);
    } catch (err) {
        console.error("❌ GET MY LEAVES ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ================= ADMIN: GET ALL LEAVES =================
exports.getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate("employeeId", "fullName email domain")
            .sort({ appliedOn: -1 });
        res.status(200).json(leaves);
    } catch (err) {
        console.error("❌ GET ALL LEAVES ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ================= ADMIN: UPDATE LEAVE STATUS =================
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const { id } = req.params;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        leave.status = status;
        if (notes) leave.notes = notes;
        await leave.save();

        // Log action
        await AuditLog.create({
            action: "LEAVE_STATUS_UPDATE",
            userId: req.user.id, // Admin ID
            details: `Updated leave status to ${status} for leave ID ${id}`,
            ip: req.ip,
            status: "Success"
        });

        res.status(200).json({ message: `Leave ${status.toLowerCase()} successfully`, leave });
    } catch (err) {
        console.error("❌ UPDATE LEAVE STATUS ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ================= GET LEAVE BALANCE (MOCK) =================
// In a real app, you'd store this in the User model or a separate LeaveBalance model
exports.getLeaveBalance = async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        // Count approved leaves for this year
        const approvedLeaves = await Leave.find({
            employeeId: req.user.id,
            status: "Approved",
            startDate: { $gte: startDate, $lte: endDate }
        });

        // Simple calculation: Assume 1 day per approved leave entry for simplicity, 
        // or calculate days difference.
        let usedDays = 0;
        approvedLeaves.forEach(leave => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            usedDays += diffDays;
        });

        res.status(200).json({
            used: usedDays
        });
    } catch (err) {
        console.error("❌ GET LEAVE BALANCE ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
// ================= ADMIN: DELETE LEAVE =================
exports.deleteLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const leave = await Leave.findByIdAndDelete(id);

        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        // Log action
        await AuditLog.create({
            action: "LEAVE_DELETED",
            userId: req.user.id, // Admin ID
            details: `Deleted leave record for employee ID ${leave.employeeId}`,
            ip: req.ip,
            status: "Success"
        });

        res.status(200).json({ message: "Leave record deleted successfully" });
    } catch (err) {
        console.error("❌ DELETE LEAVE ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
