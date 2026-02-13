// employeeRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET logged-in employee profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Employee not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET profile picture for logged-in employee
router.get("/me/profile-pic", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.profilePic || !user.profilePic.data) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    res.set("Content-Type", user.profilePic.contentType);
    res.send(user.profilePic.data);
  } catch (error) {
    console.error("❌ Error fetching profile picture:", error);
    res.status(500).json({ message: "Error retrieving profile picture" });
  }
});

// UPDATE profile
router.put("/me", authenticate, async (req, res) => {
  try {
    const { fullName, phone, domain } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, domain },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Employee not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET all employees
router.get("/all", authenticate, async (req, res) => {
  try {
    // Filter out admins (only regular employees)
    const users = await User.find({ isAdmin: false }).select("-password");
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching all employees:", err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;


// const express = require("express");
// const router = express.Router();
// const Employee = require("../models/Employee");
// const jwt = require("jsonwebtoken");

// const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// // ================= AUTH MIDDLEWARE =================
// const authenticate = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   try {
//     const token = authHeader.split(" ")[1];
//     req.user = jwt.verify(token, JWT_SECRET);
//     next();
//   } catch {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };

// // ================= GET LOGGED-IN EMPLOYEE =================
// router.get("/me", authenticate, async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.user.id).select("-password");
//     if (!employee) return res.status(404).json({ message: "User not found" });
//     res.json(employee);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ================= UPDATE PROFILE =================
// router.put("/me", authenticate, async (req, res) => {
//   try {
//     const updated = await Employee.findByIdAndUpdate(
//       req.user.id,
//       req.body,
//       { new: true }
//     ).select("-password");

//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: "Update failed" });
//   }
// });

// // ================= PROFILE PICTURE =================
// router.get("/me/profile-pic", authenticate, async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.user.id);
//     if (!employee || !employee.profilePic?.data) {
//       return res.status(404).end();
//     }

//     res.set("Content-Type", employee.profilePic.contentType);
//     res.send(employee.profilePic.data);
//   } catch {
//     res.status(500).end();
//   }
// });

// // ================= OTHER ROUTES =================
// router.post("/add", authenticate, async (req, res) => {
//   const employee = await Employee.create(req.body);
//   res.status(201).json(employee);
// });

// router.get("/", authenticate, async (req, res) => {
//   const employees = await Employee.find();
//   res.json(employees);
// });

// module.exports = router;
