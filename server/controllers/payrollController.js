const Payroll = require("../models/Payroll");
const SalaryConfig = require("../models/SalaryConfig");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Leave = require("../models/Leave");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

// ================= HELPER: Ensure Output Directory Exists =================
const ensureOutputDirectory = () => {
  const outputDir = path.join(__dirname, "../outputs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
};

// ================= CALCULATE PAYROLL FOR A MONTH =================
exports.calculatePayroll = async (req, res) => {
  console.log("=== CALCULATE PAYROLL REQUEST ===");

  try {
    const { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "Employee ID, month, and year are required"
      });
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid month. Must be between 1 and 12." });
    }

    if (year < 2000 || year > 2100) {
      return res.status(400).json({ message: "Invalid year." });
    }

    // Get employee salary configuration
    const salaryConfig = await SalaryConfig.findOne({ employeeId });
    if (!salaryConfig) {
      return res.status(404).json({
        message: "Salary configuration not found for this employee. Please create salary config first."
      });
    }

    // Get attendance data for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendanceRecords = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate attendance summary
    const totalWorkingDays = getDaysInMonth(month, year);
    const presentDays = attendanceRecords.filter(a => a.status === "Present").length;
    const absentDays = attendanceRecords.filter(a => a.status === "Absent").length;
    const lateDays = attendanceRecords.filter(a => a.status === "Late").length;
    const halfDays = attendanceRecords.filter(a => a.status === "Half Day").length;

    // Calculate total overtime hours
    const overtimeHours = attendanceRecords.reduce((sum, record) => {
      if (record.workingHours && record.workingHours > 8) {
        return sum + (record.workingHours - 8);
      }
      return sum;
    }, 0);

    // Calculate overtime pay
    const overtimePay = salaryConfig.overtimeEnabled
      ? overtimeHours * (salaryConfig.overtimeRate || 0)
      : 0;

    // --- LATE DEDUCTION LOGIC ---
    // Rule: 3 Late marks = 0.5 Day Deduction (configurable logic)
    const latePenaltyDays = Math.floor(lateDays / 3) * 0.5;

    let lateDeduction = 0;
    if (totalWorkingDays > 0) {
      const perDaySalary = (salaryConfig.baseSalary +
        (salaryConfig.allowances.hra || 0) +
        (salaryConfig.allowances.da || 0) +
        (salaryConfig.allowances.ta || 0) +
        (salaryConfig.allowances.medical || 0) +
        (salaryConfig.allowances.other || 0)) / totalWorkingDays;

      lateDeduction = perDaySalary * latePenaltyDays;
    }

    // Check if payroll already exists
    let payroll = await Payroll.findOne({ employeeId, month, year });

    const payrollData = {
      employeeId,
      month,
      year,
      baseSalary: salaryConfig.baseSalary,
      allowances: {
        hra: salaryConfig.allowances.hra || 0,
        da: salaryConfig.allowances.da || 0,
        ta: salaryConfig.allowances.ta || 0,
        medical: salaryConfig.allowances.medical || 0,
        other: salaryConfig.allowances.other || 0
      },
      deductions: {
        pf: salaryConfig.deductions.pf || 0,
        esi: salaryConfig.deductions.esi || 0,
        tax: salaryConfig.deductions.tax || 0,
        professionalTax: salaryConfig.deductions.professionalTax || 0,
        loanDeduction: 0,
        lateDeduction, // Added explicit late deduction
        other: 0
      },
      attendanceData: {
        totalWorkingDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        overtimeHours
      },
      overtimePay,
      bonus: payroll?.bonus || 0 // Preserve existing bonus if updating
    };

    if (payroll) {
      // Update existing payroll
      Object.assign(payroll, payrollData);
      await payroll.save();
      console.log("✅ Payroll updated");
    } else {
      // Create new payroll
      payroll = new Payroll(payrollData);
      await payroll.save();
      console.log("✅ Payroll created");
    }

    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate("employeeId", "fullName email domain");

    res.status(200).json({
      message: payroll ? "Payroll calculated successfully" : "Payroll updated successfully",
      payroll: populatedPayroll
    });
  } catch (err) {
    console.error("❌ CALCULATE PAYROLL ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Helper function to get days in month
function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

// ================= GET ALL PAYROLLS (ADMIN) =================
exports.getAllPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId, paymentStatus } = req.query;
    const query = {};

    if (employeeId) query.employeeId = employeeId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const payrolls = await Payroll.find(query)
      .populate("employeeId", "fullName email domain phone")
      .sort({ year: -1, month: -1 });

    res.status(200).json(payrolls);
  } catch (err) {
    console.error("❌ GET ALL PAYROLLS ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET MY PAYROLL (EMPLOYEE) =================
exports.getMyPayroll = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;

    const query = { employeeId };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query)
      .populate("employeeId", "fullName email domain")
      .sort({ year: -1, month: -1 });

    res.status(200).json(payrolls);
  } catch (err) {
    console.error("❌ GET MY PAYROLL ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET SINGLE PAYROLL =================
exports.getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate("employeeId", "fullName email domain phone");

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    res.status(200).json(payroll);
  } catch (err) {
    console.error("❌ GET PAYROLL ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= UPDATE PAYROLL (ADMIN) =================
// ================= UPDATE PAYROLL (ADMIN) =================
exports.updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key === 'deductions' || key === 'allowances') {
        payroll[key] = { ...payroll[key], ...updates[key] };
      } else {
        payroll[key] = updates[key];
      }
    });

    await payroll.save(); // Triggers pre-save hook for recalculations

    // Re-fetch to populate
    const populated = await Payroll.findById(id).populate("employeeId", "fullName email domain");

    res.status(200).json({
      message: "Payroll updated successfully",
      payroll: populated
    });
  } catch (err) {
    console.error("❌ UPDATE PAYROLL ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= DELETE PAYROLL (ADMIN) =================
exports.deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findByIdAndDelete(id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    res.status(200).json({ message: "Payroll deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE PAYROLL ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= MARK PAYMENT AS PAID =================
exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentDate, paymentMethod, transactionId } = req.body;

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    payroll.paymentStatus = "Paid";
    payroll.paymentDate = paymentDate || new Date();
    payroll.paymentMethod = paymentMethod || "Bank Transfer";
    payroll.transactionId = transactionId || "";

    await payroll.save();

    res.status(200).json({
      message: "Payment marked as paid successfully",
      payroll
    });
  } catch (err) {
    console.error("❌ MARK AS PAID ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GENERATE PAYSLIP (EXCEL) =================
exports.generatePayslip = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate("employeeId", "fullName email domain phone");

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    const employee = payroll.employeeId;

    // Get salary config for additional details
    const salaryConfig = await SalaryConfig.findOne({
      employeeId: employee._id
    });

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payslip');

    // Styling
    const boldFont = { bold: true };
    const centerAlign = { vertical: 'middle', horizontal: 'center' };
    const borderStyle = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // COMPANY NAME
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'TECHNOVA SOFTWARES';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = centerAlign;

    // TITLE
    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Payslip for ${monthNames[payroll.month - 1]} ${payroll.year}`;
    worksheet.getCell('A2').font = { size: 14, bold: true };
    worksheet.getCell('A2').alignment = centerAlign;

    worksheet.addRow([]); // Spacer

    // EMPLOYEE DETAILS
    worksheet.mergeCells('A4:E4');
    worksheet.getCell('A4').value = 'Employee Details';
    worksheet.getCell('A4').font = boldFont;
    worksheet.getCell('A4').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCFF' }
    };

    worksheet.addRow(['Name:', employee.fullName, '', 'Domain:', salaryConfig?.domain || 'N/A']);
    worksheet.addRow(['Email:', employee.email, '', 'Phone:', employee.phone || 'N/A']);
    worksheet.addRow(['Employment Type:', salaryConfig?.employmentType || 'N/A']);

    worksheet.addRow([]); // Spacer

    // ATTENDANCE
    worksheet.mergeCells('A9:E9');
    worksheet.getCell('A9').value = 'Attendance Summary';
    worksheet.getCell('A9').font = boldFont;
    worksheet.getCell('A9').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCE5FF' }
    };

    worksheet.addRow(['Total Days', payroll.attendanceData?.totalWorkingDays || 0, 'Present', payroll.attendanceData?.presentDays || 0, 'Absent', payroll.attendanceData?.absentDays || 0]);
    worksheet.addRow(['Late Marks', payroll.attendanceData?.lateDays || 0, 'Half Days', payroll.attendanceData?.halfDays || 0, 'Overtime (Hrs)', payroll.attendanceData?.overtimeHours || 0]);

    worksheet.addRow([]); // Spacer

    // EARNINGS & DEDUCTIONS HEADERS
    worksheet.addRow(['EARNINGS', 'AMOUNT (₹)', '', 'DEDUCTIONS', 'AMOUNT (₹)']);
    const headerRow = worksheet.lastRow;
    headerRow.font = boldFont;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
      cell.border = borderStyle;
    });

    // DATA ROWS
    const earnings = [
      { label: 'Basic Salary', value: payroll.baseSalary },
      { label: 'HRA', value: payroll.allowances?.hra || 0 },
      { label: 'DA', value: payroll.allowances?.da || 0 },
      { label: 'Transport', value: payroll.allowances?.ta || 0 },
      { label: 'Medical', value: payroll.allowances?.medical || 0 },
      { label: 'Other Allowances', value: payroll.allowances?.other || 0 },
      { label: 'Overtime Pay', value: payroll.overtimePay || 0 },
      { label: 'Bonus', value: payroll.bonus || 0 }
    ];

    const deductions = [
      { label: 'PF', value: payroll.deductions?.pf || 0 },
      { label: 'ESI', value: payroll.deductions?.esi || 0 },
      { label: 'Income Tax', value: payroll.deductions?.tax || 0 },
      { label: 'Professional Tax', value: payroll.deductions?.professionalTax || 0 },
      { label: 'Loan Deduction', value: payroll.deductions?.loanDeduction || 0 },
      { label: 'Late Deduction', value: payroll.deductions?.lateDeduction || 0 },
      { label: 'Other Deductions', value: payroll.deductions?.other || 0 }
    ];

    const maxRows = Math.max(earnings.length, deductions.length);

    for (let i = 0; i < maxRows; i++) {
      const earn = earnings[i] || { label: '', value: '' };
      const ded = deductions[i] || { label: '', value: '' };

      const row = worksheet.addRow([
        earn.label,
        earn.value !== '' ? Number(earn.value).toFixed(2) : '',
        '',
        ded.label,
        ded.value !== '' ? Number(ded.value).toFixed(2) : ''
      ]);

      // Add borders
      row.getCell(1).border = borderStyle;
      row.getCell(2).border = borderStyle;
      row.getCell(4).border = borderStyle;
      row.getCell(5).border = borderStyle;
    }

    // TOTALS
    worksheet.addRow(['Gross Salary', payroll.grossSalary.toFixed(2), '', 'Total Deductions', payroll.totalDeductions.toFixed(2)]);
    const totalRow = worksheet.lastRow;
    totalRow.font = boldFont;
    totalRow.eachCell((cell) => cell.border = borderStyle);

    worksheet.addRow([]); // Spacer

    // NET PAY
    worksheet.mergeCells(`A${worksheet.rowCount + 1}:E${worksheet.rowCount + 1}`);
    const netRow = worksheet.lastRow;
    netRow.getCell(1).value = `NET PAY: ₹ ${payroll.netSalary.toFixed(2)}`;
    netRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    netRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4caf50' } };
    netRow.getCell(1).alignment = centerAlign;

    // Formatting widths
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 5;
    worksheet.getColumn(4).width = 25;
    worksheet.getColumn(5).width = 15;

    // Ensure output directory exists and get path
    const outputDir = ensureOutputDirectory();
    const fileName = `Payslip_${employee.fullName.replace(/\s/g, "_")}_${monthNames[payroll.month - 1]}_${payroll.year}.xlsx`;
    const outputPath = path.join(outputDir, fileName);

    await workbook.xlsx.writeFile(outputPath);

    // Update payroll record
    payroll.payslipGenerated = true;
    payroll.payslipPath = outputPath;
    await payroll.save();

    res.status(200).json({
      message: "Payslip generated successfully",
      fileName,
      downloadPath: outputPath
    });
  } catch (err) {
    console.error("❌ GENERATE PAYSLIP ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Helper function to create payslip document (REMOVED/DEPRECATED)
function createPayslipDocument(payroll, employee, salaryConfig, monthNames) {
  // Old implementation removed
}

// ================= GET PAYROLL SUMMARY =================
exports.getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required"
      });
    }

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    });

    const summary = {
      totalEmployees: payrolls.length,
      totalGrossSalary: payrolls.reduce((sum, p) => sum + p.grossSalary, 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetSalary: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
      paymentStatusBreakdown: {
        pending: payrolls.filter(p => p.paymentStatus === "Pending").length,
        processed: payrolls.filter(p => p.paymentStatus === "Processed").length,
        paid: payrolls.filter(p => p.paymentStatus === "Paid").length,
        onHold: payrolls.filter(p => p.paymentStatus === "On Hold").length
      },
      totalOvertimePay: payrolls.reduce((sum, p) => sum + (p.overtimePay || 0), 0),
      totalBonus: payrolls.reduce((sum, p) => sum + (p.bonus || 0), 0)
    };

    res.status(200).json(summary);
  } catch (err) {
    console.error("❌ GET SUMMARY ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= CALCULATE ALL PAYROLLS =================
exports.calculateAllPayroll = async (req, res) => {
  console.log("=== CALCULATE ALL PAYROLL REQUEST ===");
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    // 1. Get all employees who have a salary configuration AND are not admins
    // First, get list of non-admin user IDs
    const nonAdminUsers = await User.find({ isAdmin: false }).select("_id");
    const nonAdminIds = nonAdminUsers.map(u => u._id.toString());

    // Then find salary configs that belong to these users
    const employeesWithConfig = await SalaryConfig.find({
      employeeId: { $in: nonAdminIds }
    }).select("employeeId");

    const employeeIds = employeesWithConfig.map(sc => sc.employeeId);

    if (employeeIds.length === 0) {
      return res.status(404).json({ message: "No employees found with salary configuration." });
    }

    console.log(`Found ${employeeIds.length} employees with salary config.`);

    let successCount = 0;
    let failCount = 0;

    // 2. Iterate and calculate for each
    // We can reuse the logic from calculatePayroll, but we need to extract it or call it internally.
    // For simplicity and to avoid huge refactoring now, I will duplicate the core logic inside a helper
    // or just loop here. A helper is better.

    for (const empId of employeeIds) {
      try {
        await calculateSinglePayrollInternal(empId, month, year);
        successCount++;
      } catch (innerErr) {
        console.error(`Failed to calculate for employee ${empId}:`, innerErr.message);
        failCount++;
      }
    }

    res.status(200).json({
      message: `Batch calculation completed. Success: ${successCount}, Failed: ${failCount}`,
      stats: { successCount, failCount }
    });

  } catch (err) {
    console.error("❌ CALCULATE ALL ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Internal Helper for Calculation (Refactored logic from calculatePayroll)
async function calculateSinglePayrollInternal(employeeId, month, year) {
  // Validate month/year (already done in caller, but safe to keep)

  // Get employee salary configuration
  const salaryConfig = await SalaryConfig.findOne({ employeeId });
  if (!salaryConfig) throw new Error("Salary configuration not found");

  // Get attendance data
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const attendanceRecords = await Attendance.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate }
  });

  // Get approved leaves for this month
  const leaves = await Leave.find({
    employeeId,
    status: "Approved",
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  });

  // Calculate approved leave days within this month
  let approvedLeaveDays = 0;
  leaves.forEach(leave => {
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);

    // Determine the actual start and end within this month
    const actualStart = leaveStart < startDate ? startDate : leaveStart;
    const actualEnd = leaveEnd > endDate ? endDate : leaveEnd;

    const diffTime = Math.abs(actualEnd - actualStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    approvedLeaveDays += diffDays;
  });

  // Calculate attendance summary
  const totalWorkingDays = getDaysInMonth(month, year);
  // presentDays count: Full day = 1, Late = 1 (usually), Half Day = 0.5? 
  // Standard pro-rata: We count Present + Approved Leaves as "Paid Days".
  // Absent = Total - (Present + Approved Leaves)

  // presentDays count: Full day = 1, Late = 1 (usually).
  const presentCount = attendanceRecords.filter(a => a.status === "Present").length;
  const lateCount = attendanceRecords.filter(a => a.status === "Late").length;
  const halfDayCount = attendanceRecords.filter(a => a.status === "Half Day").length;

  // Displayed Present Days (Full + Late)
  const presentDays = presentCount + lateCount;

  // absentDays (Unpaid) = totalWorkingDays - (presentDays + approvedLeaveDays + halfDayCount)
  // These are the days with ZERO presence. 
  // Deductions in model will be: (absentDays * 1) + (halfDayCount * 0.5)
  const absentDays = Math.max(0, totalWorkingDays - (presentDays + approvedLeaveDays + halfDayCount));

  const lateDays = lateCount;
  const halfDays = halfDayCount;

  // Calculate total overtime hours
  const overtimeHours = attendanceRecords.reduce((sum, record) => {
    if (record.workingHours && record.workingHours > 8) {
      return sum + (record.workingHours - 8);
    }
    return sum;
  }, 0);

  // Calculate overtime pay
  const overtimePay = salaryConfig.overtimeEnabled
    ? overtimeHours * (salaryConfig.overtimeRate || 0)
    : 0;

  // Late Deduction Logic
  const latePenaltyDays = Math.floor(lateDays / 3) * 0.5;
  let lateDeduction = 0;

  if (totalWorkingDays > 0) {
    const perDaySalary = (salaryConfig.baseSalary +
      (salaryConfig.allowances.hra || 0) +
      (salaryConfig.allowances.da || 0) +
      (salaryConfig.allowances.ta || 0) +
      (salaryConfig.allowances.medical || 0) +
      (salaryConfig.allowances.other || 0)) / totalWorkingDays;

    lateDeduction = perDaySalary * latePenaltyDays;
  }

  // Determine payroll data
  const payrollData = {
    employeeId,
    month,
    year,
    baseSalary: salaryConfig.baseSalary,
    allowances: {
      hra: salaryConfig.allowances.hra || 0,
      da: salaryConfig.allowances.da || 0,
      ta: salaryConfig.allowances.ta || 0,
      medical: salaryConfig.allowances.medical || 0,
      other: salaryConfig.allowances.other || 0
    },
    deductions: {
      pf: salaryConfig.deductions.pf || 0,
      esi: salaryConfig.deductions.esi || 0,
      tax: salaryConfig.deductions.tax || 0,
      professionalTax: salaryConfig.deductions.professionalTax || 0,
      loanDeduction: 0,
      lateDeduction,
      other: 0
    },
    attendanceData: {
      totalWorkingDays,
      presentDays,
      absentDays,
      approvedLeaves: approvedLeaveDays,
      lateDays,
      halfDays,
      overtimeHours
    },
    overtimePay,
    // bonus: 0 // Do not reset bonus if it exists? 
    // Logic: if exists, keep it. checks below.
  };

  // Check if payroll already exists
  let payroll = await Payroll.findOne({ employeeId, month, year });

  if (payroll) {
    // Preserve existing bonus
    payrollData.bonus = payroll.bonus || 0;
    Object.assign(payroll, payrollData);
    await payroll.save();
  } else {
    payrollData.bonus = 0;
    payroll = new Payroll(payrollData);
    await payroll.save();
  }
  return payroll;
}

// ================= DOWNLOAD PAYSLIP =================
exports.downloadPayslip = async (req, res) => {
  try {
    const { filename } = req.params;
    const outputDir = path.join(__dirname, "../outputs");
    const filePath = path.join(outputDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("File download error:", err);
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
          res.status(500).json({ message: "Could not download file" });
        }
      }
    });

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = exports;