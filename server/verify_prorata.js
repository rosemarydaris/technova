const mongoose = require("mongoose");
const User = require("./models/User");
const Payroll = require("./models/Payroll");
const Attendance = require("./models/Attendance");
const SalaryConfig = require("./models/SalaryConfig");

const MONGO_URI = "mongodb+srv://rosemarydaris3_db_user:0AYVK8rpjnvQ7EPP@cluster0.cjvxmg2.mongodb.net/TECHNOVA";

async function verifyProRata() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Create a dummy employee
        const dummyEmail = `test_pro_rata_${Date.now()}@example.com`;
        const employee = new User({
            fullName: "Test Pro-Rata Employee",
            email: dummyEmail,
            password: "password123",
            role: "employee",
            domain: "Testing",
            phone: "1234567890",
            company: "TECHNOVA"
        });
        await employee.save();
        console.log(`Created test employee: ${employee.fullName} (${employee._id})`);

        // 2. Set up Salary Configuration
        // Base Salary: 28,000 (makes it easy for Feb which has 28 days -> 1000/day)
        const salaryConfig = new SalaryConfig({
            employeeId: employee._id,
            baseSalary: 28000,
            allowances: { hra: 0, da: 0, ta: 0, medical: 0, other: 0 },
            deductions: { pf: 0, esi: 0, tax: 0, professionalTax: 0 }
        });
        await salaryConfig.save();
        console.log("Created salary config: Base Salary 28,000");

        // 3. Create Attendance Records for February 2026
        // 2 Days Present, 26 Days Absent
        const year = 2026;
        const month = 2; // February
        const daysInMonth = 28;

        console.log("Creating attendance records for February 2026...");
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month - 1, d);
            const status = (d <= 2) ? "Present" : "Absent";

            await Attendance.create({
                employeeId: employee._id,
                date: date,
                status: status,
                checkIn: (status === "Present") ? new Date(year, month - 1, d, 9, 0) : null,
                checkOut: (status === "Present") ? new Date(year, month - 1, d, 17, 0) : null,
                workingHours: (status === "Present") ? 8 : 0
            });
        }
        console.log("Attendance records created (2 Present, 26 Absent)");

        // 4. Trigger Payroll Calculation
        // Since we want to test the logic in payrollController.js, we can simulate the calculation
        console.log("Calculating payroll...");

        // Helper to get days in month (duplicated from controller)
        const getDaysInMonth = (m, y) => new Date(y, m, 0).getDate();

        const totalWorkingDays = getDaysInMonth(month, year);
        const records = await Attendance.find({
            employeeId: employee._id,
            date: {
                $gte: new Date(year, month - 1, 1),
                $lte: new Date(year, month - 1, daysInMonth, 23, 59, 59)
            }
        });

        const presentDays = records.filter(a => a.status === "Present").length;
        const absentDays = records.filter(a => a.status === "Absent").length;

        const payrollData = {
            employeeId: employee._id,
            month,
            year,
            baseSalary: salaryConfig.baseSalary,
            allowances: { hra: 0, da: 0, ta: 0, medical: 0, other: 0 },
            deductions: { pf: 0, esi: 0, tax: 0, professionalTax: 0, lateDeduction: 0 },
            attendanceData: {
                totalWorkingDays,
                presentDays,
                absentDays,
                lateDays: 0,
                halfDays: 0,
                overtimeHours: 0
            },
            overtimePay: 0,
            bonus: 0
        };

        const payroll = new Payroll(payrollData);
        await payroll.save(); // This triggers the pre-save hook in Payroll.js

        // 5. Verify Results
        console.log("\n--- Payroll Result ---");
        console.log(`Gross Salary: ${payroll.grossSalary}`);
        console.log(`Total Deductions: ${payroll.totalDeductions}`);
        console.log(`Net Salary: ${payroll.netSalary}`);

        const expectedNet = (28000 / 28) * 2;
        console.log(`Expected Net Salary (2/28 of 28000): ${expectedNet}`);

        if (Math.abs(payroll.netSalary - expectedNet) < 0.01) {
            console.log("\n✅ SUCCESS: Pro-rata calculation is working correctly!");
        } else {
            console.log("\n❌ FAILURE: Pro-rata calculation mismatch.");
        }

        // Cleanup
        console.log("\nCleaning up test data...");
        await Attendance.deleteMany({ employeeId: employee._id });
        await SalaryConfig.deleteMany({ employeeId: employee._id });
        await Payroll.deleteMany({ employeeId: employee._id });
        await User.deleteOne({ _id: employee._id });
        console.log("Cleanup complete.");

    } catch (err) {
        console.error("Error during verification:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyProRata();
