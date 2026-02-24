const express = require("express");
const router = express.Router();

const {
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  getAuditLogs
} = require("../controllers/adminController");

// routes
router.get("/employees", getAllEmployees);
router.put("/employee/:id", updateEmployee);
router.delete("/employee/:id", deleteEmployee);
router.get("/logs", getAuditLogs); // New logging route
router.get("/stats/summary", require("../controllers/adminController").getReportStats);

module.exports = router;
