const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["info", "warning", "success", "error", "task", "payroll", "general", "Salary", "Leave", "Important Work", "General"],
        default: "info"
    },
    recipientType: {
        type: String,
        enum: ["all", "domain", "individual"],
        required: true
    },
    domain: {
        type: String,
        default: null
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    targetUrl: {
        type: String,
        default: ""
    },
    isImportant: {
        type: Boolean,
        default: false
    },
    scheduledFor: {
        type: Date,
        default: Date.now
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);
