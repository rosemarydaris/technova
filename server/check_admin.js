const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/technova")
    .then(async () => {
        console.log("Connected to MongoDB");

        // Find the admin user
        const admin = await User.findOne({ email: "admin@technova.com" });
        if (admin) {
            console.log("Found Admin User:", {
                id: admin._id,
                name: admin.fullName,
                email: admin.email,
                isAdmin: admin.isAdmin,
                domain: admin.domain
            });

            if (!admin.isAdmin) {
                console.log("⚠️ Admin user has isAdmin: false! Updating to true...");
                admin.isAdmin = true;
                await admin.save();
                console.log("✅ Updated isAdmin to true.");
            } else {
                console.log("✅ Admin user already has isAdmin: true.");
            }
        } else {
            console.log("❌ Admin user not found with email 'admin@technova.com'. Searching by name 'Administrator'...");
            const adminByName = await User.findOne({ fullName: "Administrator" });
            if (adminByName) {
                console.log("Found Admin User by Name:", {
                    id: adminByName._id,
                    name: adminByName.fullName,
                    email: adminByName.email,
                    isAdmin: adminByName.isAdmin
                });
                if (!adminByName.isAdmin) {
                    console.log("⚠️ Updating isAdmin to true...");
                    adminByName.isAdmin = true;
                    await adminByName.save();
                }
            } else {
                console.log("❌ Administrator not found.");
            }
        }

        // Check total non-admin users
        const nonAdmins = await User.countDocuments({ isAdmin: false });
        console.log(`Total non-admin users visible to API: ${nonAdmins}`);

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
