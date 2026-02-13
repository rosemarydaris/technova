const SalaryConfig = require("../models/SalaryConfig");
const User = require("../models/User");

// ================= CREATE SALARY CONFIGURATION =================
exports.createSalaryConfig = async (req, res) => {
  console.log("=== CREATE SALARY CONFIG REQUEST ===");

  try {
    const {
      employeeId,
      baseSalary,
      allowances,
      deductions,
      overtimeEnabled,
      overtimeRate,
      bankDetails,
      employmentType,
      domain,
      panNumber,
      esiNumber,
      pfNumber,
      salaryDay
    } = req.body;

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if config already exists
    const existingConfig = await SalaryConfig.findOne({ employeeId });
    if (existingConfig) {
      return res.status(400).json({
        message: "Salary configuration already exists for this employee"
      });
    }

    const salaryConfig = new SalaryConfig({
      employeeId,
      baseSalary: baseSalary || 0,
      allowances: allowances || {},
      deductions: deductions || {},
      overtimeEnabled: overtimeEnabled || false,
      overtimeRate: overtimeRate || 0,
      bankDetails: bankDetails || {},
      employmentType: employmentType || "Full-time",
      domain,
      panNumber,
      esiNumber,
      pfNumber,
      salaryDay: salaryDay || 1
    });

    await salaryConfig.save();
    console.log("✅ Salary configuration created");

    const populatedConfig = await SalaryConfig.findById(salaryConfig._id)
      .populate("employeeId", "fullName email domain");

    res.status(201).json({
      message: "Salary configuration created successfully",
      salaryConfig: populatedConfig
    });
  } catch (err) {
    console.error("❌ CREATE SALARY CONFIG ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Salary configuration already exists for this employee"
      });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET ALL SALARY CONFIGURATIONS (ADMIN) =================
exports.getAllSalaryConfigs = async (req, res) => {
  try {
    const { employmentType, domain, isActive } = req.query;
    const query = {};

    if (employmentType) query.employmentType = employmentType;
    if (domain) query.domain = domain;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const configs = await SalaryConfig.find(query)
      .populate("employeeId", "fullName email domain phone")
      .sort({ createdAt: -1 });

    res.status(200).json(configs);
  } catch (err) {
    console.error("❌ GET ALL CONFIGS ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET SALARY CONFIG BY EMPLOYEE ID =================
exports.getSalaryConfigByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const config = await SalaryConfig.findOne({ employeeId })
      .populate("employeeId", "fullName email domain phone");

    if (!config) {
      return res.status(404).json({
        message: "Salary configuration not found for this employee"
      });
    }

    res.status(200).json(config);
  } catch (err) {
    console.error("❌ GET CONFIG ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET MY SALARY CONFIG (EMPLOYEE) =================
exports.getMySalaryConfig = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const config = await SalaryConfig.findOne({ employeeId })
      .populate("employeeId", "fullName email domain");

    if (!config) {
      return res.status(404).json({
        message: "Salary configuration not found"
      });
    }

    res.status(200).json(config);
  } catch (err) {
    console.error("❌ GET MY CONFIG ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= UPDATE SALARY CONFIGURATION =================
exports.updateSalaryConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const config = await SalaryConfig.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate("employeeId", "fullName email domain");

    if (!config) {
      return res.status(404).json({
        message: "Salary configuration not found"
      });
    }

    res.status(200).json({
      message: "Salary configuration updated successfully",
      salaryConfig: config
    });
  } catch (err) {
    console.error("❌ UPDATE CONFIG ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= DELETE SALARY CONFIGURATION =================
exports.deleteSalaryConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await SalaryConfig.findByIdAndDelete(id);

    if (!config) {
      return res.status(404).json({
        message: "Salary configuration not found"
      });
    }

    res.status(200).json({
      message: "Salary configuration deleted successfully"
    });
  } catch (err) {
    console.error("❌ DELETE CONFIG ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= CALCULATE SALARY BREAKDOWN =================
exports.calculateSalaryBreakdown = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const config = await SalaryConfig.findOne({ employeeId });

    if (!config) {
      return res.status(404).json({
        message: "Salary configuration not found"
      });
    }

    const totalAllowances =
      (config.allowances.hra || 0) +
      (config.allowances.da || 0) +
      (config.allowances.ta || 0) +
      (config.allowances.medical || 0) +
      (config.allowances.other || 0);

    const totalDeductions =
      (config.deductions.pf || 0) +
      (config.deductions.esi || 0) +
      (config.deductions.tax || 0) +
      (config.deductions.professionalTax || 0);

    const grossSalary = config.baseSalary + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    const breakdown = {
      baseSalary: config.baseSalary,
      allowances: {
        hra: config.allowances.hra || 0,
        da: config.allowances.da || 0,
        ta: config.allowances.ta || 0,
        medical: config.allowances.medical || 0,
        other: config.allowances.other || 0,
        total: totalAllowances
      },
      deductions: {
        pf: config.deductions.pf || 0,
        esi: config.deductions.esi || 0,
        tax: config.deductions.tax || 0,
        professionalTax: config.deductions.professionalTax || 0,
        total: totalDeductions
      },
      grossSalary,
      netSalary,
      annualCTC: grossSalary * 12
    };

    res.status(200).json(breakdown);
  } catch (err) {
    console.error("❌ CALCULATE BREAKDOWN ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = exports;