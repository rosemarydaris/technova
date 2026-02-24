const Attendance = require("../models/Attendance");
const User = require("../models/User");

// ================= CHECK IN =================
exports.checkIn = async (req, res) => {
  console.log("=== CHECK-IN REQUEST RECEIVED ===");
  console.log("req.user:", JSON.stringify(req.user, null, 2));

  try {
    const employeeId = req.user.id;
    console.log("Employee ID:", employeeId);

    if (!employeeId) {
      console.log("❌ No employee ID found");
      return res.status(400).json({ message: "Employee ID not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log("Today's date:", today);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    console.log("Existing attendance:", attendance);

    if (attendance && attendance.checkIn) {
      console.log("⚠️ Already checked in");
      return res.status(400).json({
        message: "Already checked in today",
        attendance
      });
    }

    // Determine status: Late if after 09:15 AM
    const checkInTime = new Date();
    const officeStartTime = new Date(checkInTime);
    officeStartTime.setHours(9, 0, 0, 0); // 9:00 AM
    const lateThreshold = new Date(officeStartTime.getTime() + 15 * 60000); // 9:15 AM

    let status = "Present";
    if (checkInTime > lateThreshold) {
      status = "Late";
    }

    // Create or update attendance record
    if (!attendance) {
      console.log(`Creating new attendance record with status: ${status}...`);
      attendance = new Attendance({
        employeeId,
        date: today,
        checkIn: checkInTime,
        status: status
      });
    } else {
      console.log(`Updating existing attendance record with status: ${status}...`);
      attendance.checkIn = checkInTime;
      attendance.status = status;
    }

    console.log("Saving attendance...");
    await attendance.save();
    console.log("✅ Attendance saved successfully");

    res.status(200).json({
      message: status === "Late" ? "Checked in successfully (Late)" : "Checked in successfully",
      attendance
    });
  } catch (err) {
    console.error("❌ CHECK-IN ERROR:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      message: "Server error",
      error: err.message,
      details: err.toString()
    });
  }
};

// ================= CHECK OUT =================
exports.checkOut = async (req, res) => {
  console.log("=== CHECK-OUT REQUEST RECEIVED ===");

  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        message: "No check-in record found for today"
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: "Already checked out today",
        attendance
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    console.log("✅ Check-out successful");

    res.status(200).json({
      message: "Checked out successfully",
      attendance
    });
  } catch (err) {
    console.error("❌ CHECK-OUT ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET MY ATTENDANCE =================
exports.getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { startDate, endDate } = req.query;

    const query = { employeeId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(30);

    res.status(200).json(attendance);
  } catch (err) {
    console.error("❌ GET ATTENDANCE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET TODAY'S STATUS =================
exports.getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    res.status(200).json(attendance || {
      message: "No attendance record for today",
      status: "Absent"
    });
  } catch (err) {
    console.error("❌ GET TODAY STATUS ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= ADMIN: GET ALL ATTENDANCE =================
exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, domain, month, year } = req.query;

    // Build date filter
    let dateFilter = {};
    if (month && year) {
      // Create strict date range for the entire month
      const m = parseInt(month); // 1-12
      const y = parseInt(year);
      const sDate = new Date(y, m - 1, 1); // 1st day of month
      const eDate = new Date(y, m, 0, 23, 59, 59, 999); // extraction is safer manually or just date compare

      // Use strict comparison for date field
      dateFilter = {
        $gte: sDate,
        $lte: eDate
      };
    } else if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Build match query for Attendance collection
    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }
    if (employeeId) {
      matchStage.employeeId = new mongoose.Types.ObjectId(employeeId);
    }

    // Pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "employeeId",
          foreignField: "_id",
          as: "employeeDetails"
        }
      },
      { $unwind: "$employeeDetails" },
      {
        $project: {
          _id: 1,
          date: 1,
          status: 1,
          checkIn: 1,
          checkOut: 1,
          workingHours: 1,
          notes: 1,
          "employeeId._id": "$employeeDetails._id",
          "employeeId.fullName": "$employeeDetails.fullName",
          "employeeId.email": "$employeeDetails.email",
          "employeeId.domain": "$employeeDetails.domain"
        }
      },
      { $sort: { date: -1 } }
    ];

    // Add Domain Filter if requested
    if (domain) {
      pipeline.push({
        $match: { "employeeId.domain": { $regex: new RegExp(`^${domain}$`, 'i') } }
      });
    }

    const attendance = await Attendance.aggregate(pipeline);

    res.status(200).json(attendance);
  } catch (err) {
    console.error("❌ GET ALL ATTENDANCE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= ADMIN: MARK ATTENDANCE MANUALLY =================
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, notes } = req.body;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employeeId,
      date: attendanceDate
    });

    if (attendance) {
      attendance.status = status || attendance.status;
      attendance.checkIn = checkIn ? new Date(checkIn) : attendance.checkIn;
      attendance.checkOut = checkOut ? new Date(checkOut) : attendance.checkOut;
      attendance.notes = notes || attendance.notes;
    } else {
      attendance = new Attendance({
        employeeId,
        date: attendanceDate,
        status,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        notes
      });
    }

    await attendance.save();

    res.status(200).json({
      message: "Attendance marked successfully",
      attendance
    });
  } catch (err) {
    console.error("❌ MARK ATTENDANCE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= ADMIN: GET ATTENDANCE SUMMARY =================
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendance = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === "Present").length,
      absent: attendance.filter(a => a.status === "Absent").length,
      late: attendance.filter(a => a.status === "Late").length,
      halfDay: attendance.filter(a => a.status === "Half Day").length,
      totalHours: attendance.reduce((sum, a) => sum + a.workingHours, 0)
    };

    res.status(200).json(summary);
  } catch (err) {
    console.error("❌ GET SUMMARY ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};