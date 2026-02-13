const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    // Basic Information (linked to User model)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    // Personal Information
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", ""],
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
    },

    // Address Details
    address: {
      house: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },

    // National ID Proof
    nationalId: {
      type: { type: String, enum: ["Aadhaar", "PAN", "Passport", ""] },
      number: { type: String },
    },

    // Emergency Contact
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },

    // Education Details
    education: {
      highestQualification: { type: String },
      course: { type: String },
      university: { type: String },
      yearOfPassing: { type: Number },
      percentage: { type: String },
    },

    // Professional Details
    professional: {
      isFresher: { type: Boolean, default: true },
      previousCompany: { type: String },
      yearsOfExperience: { type: Number },
      skills: [{ type: String }],
      lastJobRole: { type: String },
      linkedIn: { type: String },
      portfolio: { type: String },
    },

    // Bank & Salary Details
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      branch: { type: String },
      upiId: { type: String },
    },
    salaryDetails: {
      basicSalary: { type: Number },
      hra: { type: Number },
      da: { type: Number },
      otherAllowances: { type: Number },
    },

    // Job Details (Company Side)
    jobDetails: {
      department: { type: String },
      designation: { type: String },
      dateOfJoining: { type: Date },
      workLocation: { type: String },
      shiftTiming: { type: String },
      employmentType: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract", "Intern", ""],
      },
    },

    // Submission Status
    isDetailsSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);