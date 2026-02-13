// employeeDetailsController.js
const Employee = require("../models/employee");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Submit or Update Employee Details
exports.submitEmployeeDetails = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user email from User model
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const employeeData = {
            userId,
            email: user.email,
            ...req.body,
            isDetailsSubmitted: true,
        };

        // Check if employee details already exist
        let employee = await Employee.findOne({ email: user.email });

        if (employee) {
            // Update existing details
            employee = await Employee.findOneAndUpdate(
                { email: user.email },
                employeeData,
                { new: true, runValidators: true }
            );

            // Log the update
            await AuditLog.create({
                userId,
                action: "PROFILE_UPDATE",
                details: `Employee details updated`,
            });

            return res.json({
                message: "Employee details updated successfully",
                employee,
            });
        } else {
            // Create new employee details
            employee = await Employee.create(employeeData);

            // Log the creation
            await AuditLog.create({
                userId,
                action: "PROFILE_UPDATE",
                details: `Employee details submitted`,
            });

            return res.status(201).json({
                message: "Employee details submitted successfully",
                employee,
            });
        }
    } catch (err) {
        console.error("Error submitting employee details:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get My Employee Details
exports.getMyDetails = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user email
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const employee = await Employee.findOne({ email: user.email }).populate(
            "userId",
            "fullName email domain phone"
        );

        if (!employee) {
            return res.status(404).json({
                message: "Employee details not found",
                isDetailsSubmitted: false
            });
        }

        res.json(employee);
    } catch (err) {
        console.error("Error fetching employee details:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get All Employee Details (Admin Only)
exports.getAllEmployeeDetails = async (req, res) => {
    try {
        const employees = await Employee.find({ isDetailsSubmitted: true })
            .populate("userId", "fullName email domain phone company")
            .sort({ createdAt: -1 });

        res.json(employees);
    } catch (err) {
        console.error("Error fetching all employee details:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get Employee Details by ID (Admin Only)
exports.getEmployeeDetailsById = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findById(id).populate(
            "userId",
            "fullName email domain phone company"
        );

        if (!employee) {
            return res.status(404).json({ message: "Employee details not found" });
        }

        res.json(employee);
    } catch (err) {
        console.error("Error fetching employee details:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get Employee Details by User ID (Admin Only)
exports.getEmployeeDetailsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const employee = await Employee.findOne({ userId }).populate(
            "userId",
            "fullName email domain phone company"
        );

        if (!employee) {
            return res.status(404).json({
                message: "Employee details not found",
                isDetailsSubmitted: false
            });
        }

        res.json(employee);
    } catch (err) {
        console.error("Error fetching employee details:", err);
        res.status(500).json({ message: err.message });
    }
};
