const Notification = require("../models/Notification");
const User = require("../models/User");

// ================= CREATE NOTIFICATION =================
exports.createNotification = async (req, res) => {
    try {
        const { title, message, type, recipientType, domain, recipientId, isImportant, scheduledFor, targetUrl } = req.body;

        const senderId = req.user.id; // From auth middleware

        const newNotification = new Notification({
            title,
            message,
            type: type || 'info',
            recipientType,
            domain,
            recipientId: recipientId || null,
            isImportant: isImportant || false,
            scheduledFor: (scheduledFor && scheduledFor !== "") ? scheduledFor : Date.now(),
            senderId,
            targetUrl
        });

        await newNotification.save();

        res.status(201).json({
            message: "Notification created successfully",
            notification: newNotification
        });
    } catch (err) {
        console.error("❌ CREATE NOTIFICATION ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ================= GET MY NOTIFICATIONS (EMPLOYEE) =================
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const now = new Date();

        // Find notifications that match:
        // 1. recipientType = 'all'
        // 2. recipientType = 'individual' AND recipientId = userId
        // 3. recipientType = 'domain' AND domain = user.domain
        // AND scheduledFor <= now
        const notifications = await Notification.find({
            $or: [
                { recipientType: "all" },
                { recipientType: "individual", recipientId: userId },
                { recipientType: "domain", domain: user.domain }
            ],
            scheduledFor: { $lte: now }
        }).sort({ scheduledFor: -1, createdAt: -1 });

        res.status(200).json(notifications);
    } catch (err) {
        console.error("❌ GET MY NOTIFICATIONS ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ================= GET ALL SENT NOTIFICATIONS (ADMIN) =================
exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate("senderId", "name email")
            .populate("recipientId", "name email") // If individual
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (err) {
        console.error("❌ GET ALL NOTIFICATIONS ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ================= MARK AS READ =================
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Check if already read
        const alreadyRead = notification.readBy.find(r => r.userId.toString() === userId);
        if (!alreadyRead) {
            notification.readBy.push({ userId, readAt: new Date() });
            await notification.save();
        }

        res.status(200).json({ message: "Marked as read" });
    } catch (err) {
        console.error("❌ MARK AS READ ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ================= DELETE NOTIFICATION =================
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndDelete(id);
        res.status(200).json({ message: "Notification deleted" });
    } catch (err) {
        console.error("❌ DELETE NOTIFICATION ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
