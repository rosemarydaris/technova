const mongoose = require("mongoose");

const salaryConfigSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  // Base Salary Details
  baseSalary: {
    type: Number,
    required: true,
    default: 0
  },

  // Standard Allowances (percentages or fixed amounts)
  allowances: {
    hra: {
      type: Number,
      default: 0,
      description: "House Rent Allowance"
    },
    da: {
      type: Number,
      default: 0,
      description: "Dearness Allowance"
    },
    ta: {
      type: Number,
      default: 0,
      description: "Transport Allowance"
    },
    medical: {
      type: Number,
      default: 0,
      description: "Medical Allowance"
    },
    other: {
      type: Number,
      default: 0,
      description: "Other Allowances"
    }
  },

  // Standard Deductions (percentages or fixed amounts)
  deductions: {
    pf: {
      type: Number,
      default: 0,
      description: "Provident Fund (usually 12% of basic)"
    },
    esi: {
      type: Number,
      default: 0,
      description: "Employee State Insurance (0.75% if salary < 21000)"
    },
    professionalTax: {
      type: Number,
      default: 0,
      description: "Professional Tax (state-specific)"
    },
    tax: {
      type: Number,
      default: 0,
      description: "Income Tax (TDS)"
    }
  },

  // Overtime Configuration
  overtimeEnabled: {
    type: Boolean,
    default: false
  },
  overtimeRate: {
    type: Number,
    default: 0, // Per hour rate
    description: "Overtime pay per hour"
  },

  // Bank Details
  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    branchName: { type: String },
    accountHolderName: { type: String }
  },

  // Employment Details
  employmentType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Intern"],
    default: "Full-time"
  },
  domain: {
    type: String
  },

  // PAN & Other IDs
  panNumber: {
    type: String
  },
  esiNumber: {
    type: String
  },
  pfNumber: {
    type: String
  },

  // Salary Cycle
  salaryDay: {
    type: Number,
    default: 1, // Day of month when salary is paid
    min: 1,
    max: 31
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("SalaryConfig", salaryConfigSchema);