// createAdmin.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const adminData = {
      email: "admin@technova.com",
      password: "admin123",  // Change this!
      // ✅ Minimal required fields for admin
      fullName: "Administrator",
      company: "System",
      phone: "9778597815",
      domain: "admin",
      isAdmin: true  // ✅ This makes them admin
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("❌ Admin already exists with email:", adminData.email);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminData);
    
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", adminData.email);
    console.log("🔑 Password:", adminData.password);
    console.log("⚠️  Please change the password after first login!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();