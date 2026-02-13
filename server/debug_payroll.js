const mongoose = require("mongoose");
const User = require("./models/User");
const Payroll = require("./models/Payroll");

const MONGO_URI = "mongodb+srv://rosemarydaris3_db_user:0AYVK8rpjnvQ7EPP@cluster0.cjvxmg2.mongodb.net/TECHNOVA";

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB");

        try {
            const payrolls = await Payroll.find().populate("employeeId", "fullName email domain");
            console.log(`Found ${payrolls.length} payroll records.`);

            payrolls.forEach((p, index) => {
                console.log(`--- Payroll ${index + 1} ---`);
                console.log(`Month/Year: ${p.month}/${p.year}`);
                console.log(`Employee: ${p.employeeId ? p.employeeId.fullName : 'NULL'}`);
                console.log(`Domain: ${p.employeeId ? p.employeeId.domain : 'NULL'}`);

                console.log(`Base Salary: ${p.baseSalary}`);
                console.log(`Allowances:`, p.allowances);
                console.log(`Gross Salary: ${p.grossSalary}`);
                console.log(`Total Deductions: ${p.totalDeductions}`);
                console.log(`Net Salary: ${p.netSalary}`);
            });

        } catch (err) {
            console.error("Error:", err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error("Connection error:", err));
