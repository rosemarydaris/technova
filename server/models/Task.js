const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  addedBy: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    default: "General"
  },
  assignedTo: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  assignedBy: {
    type: String,
    default: "admin@technova.com"
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending"
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  attachments: [
    {
      fileName: String,
      filePath: String,
      uploadedBy: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  comments: [commentSchema]
}, {
  timestamps: true
});

// Index for faster queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);