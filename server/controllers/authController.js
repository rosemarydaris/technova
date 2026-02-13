// controllers/authController.js
const User = require("../models/User");
const AuditLog = require("../models/AuditLog"); // Import AuditLog
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

/* =========================
   REGISTER USER (Employees Only)
========================= */
exports.registerUser = async (req, res) => {
  try {
    console.log("📝 Registration request received:", req.body);

    const { fullName, email, company, phone, password, domain } = req.body;

    // Validation
    if (!fullName || !email || !company || !phone || !password || !domain) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Prepare user data
    const userData = {
      fullName,
      email,
      company,
      phone,
      password,
      domain,
      isAdmin: false  // ✅ Regular employees are not admins
    };

    // Add profile picture if uploaded
    if (req.file) {
      userData.profilePic = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
      console.log("📸 Profile picture uploaded:", req.file.mimetype);
    }

    // Create user (always employee, isAdmin defaults to false)
    const user = await User.create(userData);

    // Generate JWT token for immediate login
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Log the registration
    await AuditLog.create({
      action: "REGISTER",
      userId: user._id,
      userName: user.fullName,
      details: `New user registration: ${user.email}`,
      ip: req.ip || req.connection.remoteAddress,
      status: "Success"
    });

    console.log("✅ User registered successfully:", user.email);

    res.status(201).json({
      message: "User registered successfully",
      token, // Return token for auto-login
      name: user.fullName,
      email: user.email,
      domain: user.domain,
      hasProfilePic: !!user.profilePic
    });

  } catch (error) {
    console.error("❌ REGISTRATION ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   LOGIN USER
========================= */
exports.loginUser = async (req, res) => {
  try {
    console.log("🔑 Login attempt:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      // Log failed attempt (User not found)
      await AuditLog.create({
        action: "LOGIN",
        details: `Failed login attempt for email: ${email} (User not found)`,
        ip: req.ip || req.connection.remoteAddress,
        status: "Failed"
      });
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔒 Password match:", isMatch);

    if (!isMatch) {
      // Log failed attempt (Wrong password)
      await AuditLog.create({
        action: "LOGIN",
        userId: user._id,
        userName: user.fullName,
        details: `Failed login attempt for: ${email} (Invalid password)`,
        ip: req.ip || req.connection.remoteAddress,
        status: "Failed"
      });
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Log successful login
    await AuditLog.create({
      action: "LOGIN",
      userId: user._id,
      userName: user.fullName,
      details: `User logged in successfully`,
      ip: req.ip || req.connection.remoteAddress,
      status: "Success"
    });

    console.log("✅ Login successful:", {
      email: user.email,
      isAdmin: user.isAdmin
    });

    // ✅ Return "admin" or employee domain for navigation
    res.status(200).json({
      message: "Login successful",
      token,
      name: user.fullName,
      domain: user.isAdmin ? "admin" : user.domain,  // ✅ If admin, return "admin"
      hasProfilePic: !!user.profilePic
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET PROFILE PICTURE
========================= */
exports.getProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.profilePic || !user.profilePic.data) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    res.set("Content-Type", user.profilePic.contentType);
    res.send(user.profilePic.data);
  } catch (error) {
    console.error("❌ Error fetching profile picture:", error);
    res.status(500).json({ message: "Error retrieving profile picture" });
  }
};