const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Must match the model name in User.js
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkOut: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "Half Day"],
    default: "Absent"
  },
  workingHours: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Calculate working hours before saving
attendanceSchema.pre("save", function () {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    this.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimals

    // Auto-set status based on working hours, but respect "Late"
    if (this.workingHours >= 8) {
      // If already marked as Late, don't revert to Present
      if (this.status !== "Late") {
        this.status = "Present";
      }
    } else if (this.workingHours >= 4) {
      this.status = "Half Day";
    } else {
      this.status = "Absent";
    }
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);