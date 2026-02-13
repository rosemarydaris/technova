const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },

  // Salary Components
  baseSalary: {
    type: Number,
    required: true,
    default: 0
  },
  allowances: {
    hra: { type: Number, default: 0 }, // House Rent Allowance
    da: { type: Number, default: 0 },  // Dearness Allowance
    ta: { type: Number, default: 0 },  // Transport Allowance
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Deductions
  deductions: {
    pf: { type: Number, default: 0 },  // Provident Fund
    esi: { type: Number, default: 0 }, // Employee State Insurance
    tax: { type: Number, default: 0 }, // Income Tax
    professionalTax: { type: Number, default: 0 },
    loanDeduction: { type: Number, default: 0 },
    lateDeduction: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Attendance-based calculations
  attendanceData: {
    totalWorkingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    approvedLeaves: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 }
  },

  // Overtime & Bonuses
  overtimePay: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  },

  // Calculated Totals
  grossSalary: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },

  // Payment Info
  paymentStatus: {
    type: String,
    enum: ["Pending", "Processed", "Paid", "On Hold"],
    default: "Pending"
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "Cash", "Cheque"],
    default: "Bank Transfer"
  },
  transactionId: {
    type: String
  },

  // Notes
  notes: {
    type: String,
    default: ""
  },

  // Generated Payslip
  payslipGenerated: {
    type: Boolean,
    default: false
  },
  payslipPath: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index to ensure one payroll record per employee per month-year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Pre-save hook to calculate totals
payrollSchema.pre("save", function () {
  // Calculate total allowances
  const totalAllowances =
    (this.allowances.hra || 0) +
    (this.allowances.da || 0) +
    (this.allowances.ta || 0) +
    (this.allowances.medical || 0) +
    (this.allowances.other || 0);

  // Calculate gross salary (Basic + HRA + Allowances)
  this.grossSalary =
    (this.baseSalary || 0) +
    totalAllowances;

  // Calculate total deductions
  this.totalDeductions =
    (this.deductions.pf || 0) +
    (this.deductions.esi || 0) +
    (this.deductions.tax || 0) +
    (this.deductions.professionalTax || 0) +
    (this.deductions.loanDeduction || 0) +
    (this.deductions.lateDeduction || 0) +
    (this.deductions.other || 0);

  // Deduct for absent days (pro-rata calculation)
  // Per Day Salary = Gross / Total working days
  // Deduction for absence = Per Day Salary × Absent Days
  if (this.attendanceData.totalWorkingDays > 0) {
    const perDaySalary = this.grossSalary / this.attendanceData.totalWorkingDays;
    const absentDeduction = perDaySalary * (this.attendanceData.absentDays || 0);

    // Half day is effectively 0.5 absent day, so we can treat it similarly or separately
    // If halfDays are just counted as 0.5 absent in 'absentDays', we don't need this.
    // Assuming 'absentDays' tracks full absences and 'halfDays' tracks half days:
    const halfDayDeduction = (perDaySalary / 2) * (this.attendanceData.halfDays || 0);

    this.totalDeductions += absentDeduction + halfDayDeduction;
  }

  // Calculate net salary
  // Final Salary = Gross - Total Deductions + Bonus
  this.netSalary =
    this.grossSalary -
    this.totalDeductions +
    (this.bonus || 0) +
    (this.overtimePay || 0);

  // Ensure net salary is not negative
  if (this.netSalary < 0) {
    this.netSalary = 0;
  }
});

module.exports = mongoose.model("Payroll", payrollSchema);