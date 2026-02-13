const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ["LOGIN", "PROFILE_UPDATE", "REGISTER", "DELETE_USER", "LEAVE_APPLIED", "LEAVE_STATUS_UPDATE", "LEAVE_DELETED"]
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    userName: {
        type: String,
        required: false
    },
    details: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        default: "Unknown"
    },
    status: {
        type: String,
        enum: ["Success", "Failed"],
        default: "Success"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
