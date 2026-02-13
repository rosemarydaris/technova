const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    leaveType: {
        type: String, // Sick, Casual, Annual, Unpaid, Half Day
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    },
    appliedOn: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String // Admin notes
    }
});

module.exports = mongoose.model("Leave", LeaveSchema);
