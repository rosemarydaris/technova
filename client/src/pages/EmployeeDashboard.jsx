import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Briefcase, Phone, Calendar, Edit3,
  CheckCircle, X, LogOut, Bell, Clipboard, DollarSign,
  Clock, MapPin, Shield, Camera
} from "lucide-react";

const EmployeeDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    domain: "",
  });
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  const [salaryConfig, setSalaryConfig] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  // Employee Details State
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsFormData, setDetailsFormData] = useState({
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    bloodGroup: "",
    address: { house: "", city: "", state: "", pincode: "" },
    nationalId: { type: "", number: "" },
    emergencyContact: { name: "", phone: "", relationship: "" },
    education: { highestQualification: "", course: "", university: "", yearOfPassing: "", percentage: "" },
    professional: { isFresher: true, previousCompany: "", yearsOfExperience: "", skills: "", lastJobRole: "", linkedIn: "", portfolio: "" },
    bankDetails: { bankName: "", accountNumber: "", ifscCode: "", branch: "", upiId: "" },
    salaryDetails: { basicSalary: "", hra: "", da: "", otherAllowances: "" },
    jobDetails: { department: "", designation: "", dateOfJoining: "", workLocation: "", shiftTiming: "", employmentType: "" }
  });

  // Leave State
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({ total: 0, used: 0, remaining: 0 });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    startDate: "",
    endDate: "",
    leaveType: "Sick",
    reason: ""
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile();
    fetchProfilePicture();
    fetchTodayStatus();
    fetchAttendanceHistory();
    fetchMyLeaves();
    fetchLeaveBalance();
  }, [token, navigate]);

  useEffect(() => {
    if (activeTab === "tasks") {
      fetchTasks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "payroll") {
      fetchMyPayrolls();
      fetchMySalaryConfig();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "attendance") {
      fetchMyLeaves();
      fetchLeaveBalance();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "details") {
      fetchEmployeeDetails();
    }
  }, [activeTab]);

  const handleDownloadExcel = (payroll) => {
    const data = [
      ["TECHNOVA SOFTWARES - PAYSLIP"],
      [`Period: ${formatMonth(payroll.month)} ${payroll.year}`],
      [],
      ["Employee Details"],
      ["Name", user?.fullName || "Employee"],
      ["Domain", user?.domain || "N/A"],
      [],
      ["Attendance Summary"],
      ["Total Working Days", payroll.attendanceData?.totalWorkingDays || 0],
      ["Present Days", payroll.attendanceData?.presentDays || 0],
      ["Absent Days", payroll.attendanceData?.absentDays || 0],
      [],
      ["Earnings", "Amount"],
      ["Base Salary", payroll.baseSalary],
      ["Allowances", Object.values(payroll.allowances || {}).reduce((a, b) => a + Number(b), 0)],
      ["Overtime Pay", payroll.overtimePay || 0],
      ["Bonus", payroll.bonus || 0],
      ["Gross Salary", payroll.grossSalary],
      [],
      ["Deductions", "Amount"],
      ["PF", payroll.deductions?.pf || 0],
      ["Income Tax", payroll.deductions?.tax || 0],
      ["Professional Tax", payroll.deductions?.professionalTax || 0],
      ["Total Deductions", payroll.totalDeductions],
      [],
      ["Net Pay", payroll.netSalary]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payslip");
    XLSX.writeFile(wb, `Payslip_${formatMonth(payroll.month)}_${payroll.year}.xlsx`);
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/employees/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setFormData({
        fullName: res.data.fullName,
        phone: res.data.phone,
        domain: res.data.domain,
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    }
  };

  const fetchProfilePicture = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/employees/me/profile-pic", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      const imageUrl = URL.createObjectURL(res.data);
      setProfilePicUrl(imageUrl);
    } catch (err) {
      console.log("No profile picture available");
    }
  };

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await axios.get("http://localhost:5001/api/tasks/my-tasks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchMyPayrolls = async () => {
    try {
      setPayrollLoading(true);
      const res = await axios.get("http://localhost:5001/api/payroll/my-payroll", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayrolls(res.data);
    } catch (err) {
      console.error("Error fetching payrolls:", err);
    } finally {
      setPayrollLoading(false);
    }
  };

  const fetchMySalaryConfig = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/salary-config/my-config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalaryConfig(res.data);
    } catch (err) {
      console.error("Error fetching salary config:", err);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await axios.put(
        `http://localhost:5001/api/tasks/${taskId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
      alert("Task status updated successfully!");
    } catch (err) {
      alert("Failed to update task");
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/attendance/today", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/attendance/my-attendance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(
        "http://localhost:5001/api/employees/me",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data);
      setEditMode(false);
      localStorage.setItem("userName", res.data.fullName);
      localStorage.setItem("userDomain", res.data.domain);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5001/api/attendance/check-in",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      fetchTodayStatus();
      fetchAttendanceHistory();
    } catch (err) {
      alert(err.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5001/api/attendance/check-out",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      fetchTodayStatus();
      fetchAttendanceHistory();
    } catch (err) {
      alert(err.response?.data?.message || "Check-out failed");
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/leave/my-leaves", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(res.data);
    } catch (err) {
      console.error("Error fetching leaves:", err);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/leave/balance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveBalance(res.data);
    } catch (err) {
      console.error("Error fetching leave balance:", err);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setLeaveLoading(true);
    try {
      await axios.post(
        "http://localhost:5001/api/leave/apply",
        leaveFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Leave application submitted successfully!");
      setShowLeaveModal(false);
      setLeaveFormData({
        startDate: "",
        endDate: "",
        leaveType: "Sick",
        reason: ""
      });
      fetchMyLeaves();
      fetchLeaveBalance();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply for leave");
    } finally {
      setLeaveLoading(false);
    }
  };

  const fetchEmployeeDetails = async () => {
    try {
      setDetailsLoading(true);
      const res = await axios.get("http://localhost:5001/api/employee-details/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeDetails(res.data);
      // Populate form with existing data
      setDetailsFormData({
        dateOfBirth: res.data.dateOfBirth ? new Date(res.data.dateOfBirth).toISOString().split('T')[0] : "",
        gender: res.data.gender || "",
        maritalStatus: res.data.maritalStatus || "",
        bloodGroup: res.data.bloodGroup || "",
        address: res.data.address || { house: "", city: "", state: "", pincode: "" },
        nationalId: res.data.nationalId || { type: "", number: "" },
        emergencyContact: res.data.emergencyContact || { name: "", phone: "", relationship: "" },
        education: res.data.education || { highestQualification: "", course: "", university: "", yearOfPassing: "", percentage: "" },
        professional: res.data.professional || { isFresher: true, previousCompany: "", yearsOfExperience: "", skills: "", lastJobRole: "", linkedIn: "", portfolio: "" },
        bankDetails: res.data.bankDetails || { bankName: "", accountNumber: "", ifscCode: "", branch: "", upiId: "" },
        salaryDetails: res.data.salaryDetails || { basicSalary: "", hra: "", da: "", otherAllowances: "" },
        jobDetails: res.data.jobDetails || { department: "", designation: "", dateOfJoining: "", workLocation: "", shiftTiming: "", employmentType: "" }
      });
    } catch (err) {
      console.log("No employee details found yet");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSubmitEmployeeDetails = async (e) => {
    e.preventDefault();
    setDetailsLoading(true);
    try {
      // Convert skills string to array
      const submitData = {
        ...detailsFormData,
        professional: {
          ...detailsFormData.professional,
          skills: typeof detailsFormData.professional.skills === 'string'
            ? detailsFormData.professional.skills.split(',').map(s => s.trim()).filter(s => s)
            : detailsFormData.professional.skills
        }
      };

      await axios.post(
        "http://localhost:5001/api/employee-details/submit",
        submitData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Employee details submitted successfully!");
      fetchEmployeeDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit employee details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatShortMonth = (monthNum) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[monthNum - 1] || "N/A";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatMonth = (month) => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return monthNames[month - 1];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return { bg: "rgba(16,185,129,0.2)", color: "#34d399" };
      case "In Progress":
        return { bg: "rgba(251,146,60,0.2)", color: "#fb923c" };
      case "Pending":
        return { bg: "rgba(239,68,68,0.2)", color: "#f87171" };
      case "Paid":
        return { bg: "rgba(16,185,129,0.2)", color: "#34d399" };
      case "Processed":
        return { bg: "rgba(59,130,246,0.2)", color: "#60a5fa" };
      case "On Hold":
        return { bg: "rgba(239,68,68,0.2)", color: "#f87171" };
      default:
        return { bg: "rgba(100,116,139,0.2)", color: "#94a3b8" };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return { bg: "rgba(239,68,68,0.2)", color: "#f87171" };
      case "Medium":
        return { bg: "rgba(251,146,60,0.2)", color: "#fb923c" };
      case "Low":
        return { bg: "rgba(16,185,129,0.2)", color: "#34d399" };
      default:
        return { bg: "rgba(100,116,139,0.2)", color: "#94a3b8" };
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "Paid": return "#10b981";
      case "Processed": return "#3b82f6";
      case "Pending": return "#f59e0b";
      case "On Hold": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; }
        
        .dashboard-layout { display: flex; min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
        
        .sidebar { width: 280px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); border-right: 1px solid rgba(148, 163, 184, 0.1); padding: 2rem 1rem; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
        
        .logo-section { margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
        .logo { font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; }
        
        .profile-section { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
        .profile-pic-container { position: relative; width: 60px; height: 60px; }
        .profile-pic { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(59, 130, 246, 0.5); }
        .profile-pic-placeholder { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white; font-weight: 700; border: 3px solid rgba(59, 130, 246, 0.5); }
        
        .user-info { flex: 1; }
        .user-name { color: #e2e8f0; font-weight: 600; font-size: 0.95rem; }
        .user-role { color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem; }
        
        .nav-menu { flex: 1; }
        .nav-item { padding: 0.875rem 1rem; margin-bottom: 0.5rem; border-radius: 10px; color: #cbd5e1; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 0.75rem; font-size: 0.95rem; }
        .nav-item:hover { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
        .nav-item.active { background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2)); color: #60a5fa; border-left: 3px solid #3b82f6; }
        .nav-icon { font-size: 1.25rem; }
        
        .logout-btn { padding: 0.875rem 1rem; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 0.75rem; margin-top: auto; }
        .logout-btn:hover { background: rgba(239, 68, 68, 0.2); transform: translateY(-2px); }
        
        .main-content { flex: 1; padding: 2rem; overflow-y: auto; }
        
        .content-header { margin-bottom: 2rem; }
        .page-title { font-size: 2rem; color: #f1f5f9; margin-bottom: 0.5rem; font-weight: 700; }
        .page-subtitle { color: #94a3b8; font-size: 1rem; }
        
        .profile-hero-card { 
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 24px;
          padding: 0;
          margin-bottom: 2rem;
          overflow: hidden;
          position: relative;
        }
        
        .profile-hero-gradient {
          height: 180px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
          position: relative;
          overflow: hidden;
        }
        
        .profile-hero-gradient::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 30px 30px;
          animation: moveBackground 20s linear infinite;
        }
        
        @keyframes moveBackground {
          0% { transform: translate(0, 0); }
          100% { transform: translate(30px, 30px); }
        }
        
        .profile-hero-content {
          padding: 2rem;
          margin-top: -80px;
          position: relative;
        }
        
        .profile-hero-avatar {
          width: 140px;
          height: 140px;
          position: relative;
          margin: 0 auto 1.5rem;
        }
        
        .profile-pic-hero {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          object-fit: cover;
          border: 5px solid rgba(15, 23, 42, 0.9);
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.4);
        }
        
        .profile-pic-placeholder-hero {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          color: white;
          font-weight: 700;
          border: 5px solid rgba(15, 23, 42, 0.9);
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.4);
        }
        
        .profile-status-indicator {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 24px;
          height: 24px;
          background: #10b981;
          border-radius: 50%;
          border: 4px solid rgba(15, 23, 42, 0.9);
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        }
        
        .profile-hero-info {
          text-align: center;
        }
        
        .profile-hero-name {
          font-size: 2rem;
          color: #f1f5f9;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .profile-hero-role {
          font-size: 1.1rem;
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }
        
        .profile-hero-badges {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          color: #cbd5e1;
          font-size: 0.9rem;
        }
        
        .hero-badge-icon {
          font-size: 1.1rem;
        }
        
        .profile-edit-floating {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }
        
        .profile-edit-floating:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4);
        }
        
        .info-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .info-card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 20px;
          padding: 1.75rem;
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, transparent, currentColor, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .info-card:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.15);
        }
        
        .info-card:hover::before {
          opacity: 1;
        }
        
        .info-card-primary { color: #3b82f6; }
        .info-card-secondary { color: #8b5cf6; }
        .info-card-accent { color: #ec4899; }
        .info-card-success { color: #10b981; }
        
        .info-card-icon {
          font-size: 2.5rem;
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .info-card-content {
          flex: 1;
        }
        
        .info-card-label {
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
          display: block;
        }
        
        .info-card-value {
          font-size: 1.25rem;
          color: #f1f5f9;
          font-weight: 600;
          word-break: break-word;
        }
        
        .edit-form-card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 20px;
          padding: 2rem;
        }
        
        .edit-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .edit-form-title {
          font-size: 1.5rem;
          color: #f1f5f9;
          font-weight: 600;
        }
        
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
        .form-group { display: flex; flex-direction: column; }
        .form-label { color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-input { 
          background: rgba(15, 23, 42, 0.8); 
          border: 2px solid rgba(148, 163, 184, 0.2); 
          border-radius: 12px; 
          padding: 1rem; 
          color: #f1f5f9; 
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }
        .form-input:focus { 
          outline: none; 
          border-color: #3b82f6; 
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .form-value { 
          color: #f1f5f9; 
          font-size: 0.95rem; 
          padding: 1rem; 
          background: rgba(15, 23, 42, 0.5); 
          border-radius: 12px;
          border: 2px solid transparent;
        }
        
        .btn { 
          padding: 1rem 2rem; 
          border: none; 
          border-radius: 12px; 
          font-weight: 600; 
          cursor: pointer; 
          transition: all 0.3s ease; 
          font-size: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-primary { 
          background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
          color: white; 
        }
        .btn-primary:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4); 
        }
        .btn-secondary { 
          background: rgba(148, 163, 184, 0.1); 
          color: #cbd5e1; 
          border: 2px solid rgba(148, 163, 184, 0.2); 
        }
        .btn-secondary:hover { 
          background: rgba(148, 163, 184, 0.2); 
          border-color: rgba(148, 163, 184, 0.3);
        }
        .btn-success { 
          background: linear-gradient(135deg, #10b981, #059669); 
          color: white; 
        }
        .btn-success:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4); 
        }

        /* Glassmorphism Classes */
        .glass-card {
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .mesh-gradient {
          background-color: #0f172a;
          background-image: 
            radial-gradient(at 0% 0%, hsla(217,100%,33%,0.5) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(271,76%,34%,0.4) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(339,81%,37%,0.3) 0, transparent 50%);
          animation: meshAnimation 15s ease infinite alternate;
        }

        @keyframes meshAnimation {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }

        .profile-hero-card { 
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 24px;
          margin-bottom: 2.5rem;
          overflow: hidden;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .profile-hero-gradient {
          height: 220px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          position: relative;
          overflow: hidden;
        }

        .mesh-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.6;
          background-image: 
            radial-gradient(at 20% 30%, #3b82f6 0px, transparent 50%),
            radial-gradient(at 80% 20%, #8b5cf6 0px, transparent 50%),
            radial-gradient(at 50% 80%, #ec4899 0px, transparent 50%);
          filter: blur(60px);
          animation: meshFlow 20s infinite alternate;
        }

        @keyframes meshFlow {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.2) translate(5%, 5%); }
          100% { transform: scale(1) translate(-5%, -5%); }
        }
        
        .profile-hero-content {
          padding: 0 2.5rem 2.5rem;
          margin-top: -90px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .profile-hero-avatar-wrapper {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .profile-hero-avatar {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          padding: 6px;
          background: linear-gradient(135deg, #3b82f6, #ec4899);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        
        .profile-pic-hero {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #1e293b;
        }
        
        .profile-pic-placeholder-hero {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          color: #3b82f6;
          font-weight: 700;
          border: 4px solid #1e293b;
        }
        
        .profile-status-indicator {
          position: absolute;
          bottom: 15px;
          right: 15px;
          width: 22px;
          height: 22px;
          background: #10b981;
          border-radius: 50%;
          border: 4px solid #1e293b;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }
        
        .profile-hero-name {
          font-size: 2.5rem;
          color: #fff;
          font-weight: 800;
          margin-bottom: 0.25rem;
          letter-spacing: -0.5px;
        }
        
        .profile-hero-role {
          font-size: 1.1rem;
          color: #94a3b8;
          font-weight: 500;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .profile-hero-badges {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1.25rem;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          color: #e2e8f0;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .hero-badge:hover {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
        }
        
        .hero-badge-icon {
          color: #3b82f6;
        }
        
        .profile-edit-floating {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
        }
        
        .profile-edit-floating:hover {
          background: #3b82f6;
          transform: rotate(90deg);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        
        .info-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .info-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 20px;
        }

        .info-card:hover {
          transform: translateY(-8px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .info-card-icon-wrapper {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }
        
        .info-card-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.4rem;
        }
        
        .info-card-value {
          font-size: 1.15rem;
          color: #f1f5f9;
          font-weight: 600;
          word-break: break-all;
          line-height: 1.4;
        }

        .section-separator {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.2), transparent);
          margin: 3rem 0;
        }

        .btn-group { 
          display: flex; 
          gap: 1rem; 
          justify-content: center;
        }
        
        .card { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .card-title { font-size: 1.25rem; color: #f1f5f9; margin-bottom: 1rem; font-weight: 600; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-card { background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 1.25rem; }
        .stat-label { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.5rem; }
        .stat-value { color: #f1f5f9; font-size: 1.75rem; font-weight: 700; }
        
        .attendance-table { width: 100%; border-collapse: collapse; }
        .attendance-table thead { background: rgba(15, 23, 42, 0.8); }
        .attendance-table th { padding: 1rem; text-align: left; color: #94a3b8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
        .attendance-table td { padding: 1rem; color: #cbd5e1; border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
        .attendance-table tbody tr:hover { background: rgba(59, 130, 246, 0.05); }
        
        .status-badge { padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .status-present { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        .status-absent { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .status-late { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .status-halfday { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .status-pending { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .status-approved { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        .status-rejected { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .status-absent { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .status-late { background: rgba(251, 146, 60, 0.2); color: #fb923c; }
        .status-halfday { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

        .task-card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; transition: all 0.3s ease; }
        .task-card:hover { border-color: rgba(59, 130, 246, 0.3); }
        .task-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; }
        .task-title { color: #f1f5f9; font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
        .task-description { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
        .task-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
        
        @media (max-width: 968px) {
          .dashboard-layout { flex-direction: column; }
          .sidebar { width: 100%; height: auto; position: relative; }
          .form-grid { grid-template-columns: 1fr; }
          .info-cards-grid { grid-template-columns: 1fr; }
        }

      `}</style>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-section">
            <div className="logo">TECHNOVA</div>
            {profile && (
              <div className="profile-section">
                <div className="profile-pic-container">
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" className="profile-pic" />
                  ) : (
                    <div className="profile-pic-placeholder">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">{profile.fullName}</div>
                  <div className="user-role">{profile.domain}</div>
                </div>
              </div>
            )}
          </div>

          <nav className="nav-menu">
            <div
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <span className="nav-icon">👤</span>
              View Profile
            </div>
            <div
              className={`nav-item ${activeTab === "attendance" ? "active" : ""}`}
              onClick={() => setActiveTab("attendance")}
            >
              <Calendar className="nav-icon" />
              <span>Attendance Marking</span>
            </div>
            <div
              className={`nav-item ${activeTab === "tasks" ? "active" : ""}`}
              onClick={() => setActiveTab("tasks")}
            >
              <span className="nav-icon">📋</span>
              My Tasks
            </div>
            <div
              className={`nav-item ${activeTab === "payroll" ? "active" : ""}`}
              onClick={() => setActiveTab("payroll")}
            >
              <span className="nav-icon">💰</span>
              My Payslips
            </div>
            <div
              className={`nav-item ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => navigate("/my-notifications")}
            >
              <span className="nav-icon">🔔</span>
              Notifications
            </div>
            <div
              className={`nav-item ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              <span className="nav-icon">📝</span>
              Additional Details
            </div>
          </nav>

          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === "profile" && (
            <>
              <div className="content-header">
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">View and manage your personal information</p>
              </div>

              {/* Hero Profile Card */}
              {profile && (
                <div className="profile-hero-card">
                  <div className="profile-hero-gradient">
                    <div className="mesh-overlay"></div>
                  </div>
                  <div className="profile-hero-content">
                    {!editMode && (
                      <button className="profile-edit-floating" onClick={() => setEditMode(true)} title="Edit Profile">
                        <Edit3 size={20} />
                      </button>
                    )}
                    <div className="profile-hero-avatar-wrapper">
                      <div className="profile-hero-avatar">
                        {profilePicUrl ? (
                          <img src={profilePicUrl} alt="Profile" className="profile-pic-hero" />
                        ) : (
                          <div className="profile-pic-placeholder-hero">
                            {profile.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="profile-status-indicator"></div>
                    </div>

                    <div className="profile-hero-info">
                      <h2 className="profile-hero-name">{profile.fullName}</h2>
                      <p className="profile-hero-role">{profile.domain || "Technova Member"}</p>

                      <div className="profile-hero-badges">
                        <span className="hero-badge">
                          <Mail size={16} className="hero-badge-icon" />
                          {profile.email}
                        </span>
                        {profile.phone && (
                          <span className="hero-badge">
                            <Phone size={16} className="hero-badge-icon" />
                            {profile.phone}
                          </span>
                        )}
                        <span className="hero-badge">
                          <Calendar size={16} className="hero-badge-icon" />
                          Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Information Cards Grid */}
              {profile && (
                <>
                  {!editMode ? (
                    <div className="info-cards-grid">
                      <div className="info-card glass-card">
                        <div className="info-card-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                          <User size={24} color="#3b82f6" />
                        </div>
                        <div className="info-card-content">
                          <label className="info-card-label">User Identity</label>
                          <div className="info-card-value">{profile.fullName}</div>
                        </div>
                      </div>

                      <div className="info-card glass-card">
                        <div className="info-card-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                          <Mail size={24} color="#8b5cf6" />
                        </div>
                        <div className="info-card-content">
                          <label className="info-card-label">Communication</label>
                          <div className="info-card-value">{profile.email}</div>
                        </div>
                      </div>

                      <div className="info-card glass-card">
                        <div className="info-card-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                          <Briefcase size={24} color="#ec4899" />
                        </div>
                        <div className="info-card-content">
                          <label className="info-card-label">Specialization</label>
                          <div className="info-card-value">{profile.domain || "N/A"}</div>
                        </div>
                      </div>

                      <div className="info-card glass-card">
                        <div className="info-card-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                          <Phone size={24} color="#10b981" />
                        </div>
                        <div className="info-card-content">
                          <label className="info-card-label">Contact Line</label>
                          <div className="info-card-value">{profile.phone || "Not linked"}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="edit-form-card glass-card">
                      <div className="edit-form-header">
                        <h2 className="edit-form-title">
                          <Shield size={24} style={{ marginRight: '10px', verticalAlign: 'middle', color: '#3b82f6' }} />
                          Refine Your Profile
                        </h2>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input
                            className="form-input"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email Address</label>
                          <div className="form-value">{profile.email}</div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Domain</label>
                          <input
                            className="form-input"
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            placeholder="Enter your domain"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Phone Number</label>
                          <input
                            className="form-input"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>

                      <div className="btn-group">
                        <button className="btn btn-success" onClick={handleUpdate}>
                          <CheckCircle size={20} /> Save Changes
                        </button>
                        <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                          <X size={20} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "attendance" && (
            <>
              <div className="content-header">
                <h1 className="page-title">Attendance Tracker</h1>
                <p className="page-subtitle">Track your daily attendance and working hours</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Status</div>
                  <div className="stat-value" style={{ fontSize: "1.25rem" }}>
                    {todayStatus?.checkIn ? todayStatus.status : "Not Checked In"}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Check In</div>
                  <div className="stat-value" style={{ fontSize: "1.25rem" }}>
                    {formatTime(todayStatus?.checkIn)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Check Out</div>
                  <div className="stat-value" style={{ fontSize: "1.25rem" }}>
                    {formatTime(todayStatus?.checkOut)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Hours Worked</div>
                  <div className="stat-value" style={{ fontSize: "1.25rem" }}>
                    {todayStatus?.workingHours?.toFixed(2) || "0.00"} hrs
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 className="card-title" style={{ margin: 0 }}>Attendance Controls</h2>
                  <button className="btn btn-primary" onClick={() => setShowLeaveModal(true)}>
                    <Calendar size={18} /> Apply for Leave
                  </button>
                </div>
                <div className="btn-group">
                  {!todayStatus?.checkIn ? (
                    <button className="btn btn-success" onClick={handleCheckIn}>
                      ✓ Check In
                    </button>
                  ) : !todayStatus?.checkOut ? (
                    <button className="btn btn-primary" onClick={handleCheckOut}>
                      ✓ Check Out
                    </button>
                  ) : (
                    <div style={{ color: "#34d399", fontWeight: "600" }}>
                      ✓ You've completed your work for today!
                    </div>
                  )}
                </div>
              </div>

              <div className="content-header" style={{ marginTop: '2rem' }}>
                <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Leave Management</h2>
                <p className="page-subtitle">View your leave balance and history</p>
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b', padding: '2rem' }}>
                  <div className="stat-label" style={{ fontSize: '1rem' }}>Total Leaves Taken</div>
                  <div className="stat-value" style={{ fontSize: '3rem' }}>{leaveBalance.used}</div>
                  <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Calculated for the current calendar year</p>
                </div>
              </div>

              <div className="card">
                <h2 className="card-title">Leave Requests History</h2>
                {leaves.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>No leave applications found.</p>
                ) : (
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => (
                        <tr key={leave._id}>
                          <td>{leave.leaveType}</td>
                          <td>{formatDate(leave.startDate)}</td>
                          <td>{formatDate(leave.endDate)}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {leave.reason}
                          </td>
                          <td>
                            <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="card">
                <h2 className="card-title">Attendance History</h2>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.slice(0, 10).map((record) => (
                      <tr key={record._id}>
                        <td>{formatDate(record.date)}</td>
                        <td>{formatTime(record.checkIn)}</td>
                        <td>{formatTime(record.checkOut)}</td>
                        <td>{record.workingHours?.toFixed(2) || "—"}</td>
                        <td>
                          <span className={`status-badge status-${record.status.toLowerCase().replace(" ", "")}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "tasks" && (
            <>
              <div className="content-header">
                <h1 className="page-title">📋 My Tasks</h1>
                <p className="page-subtitle">View and manage your assigned tasks</p>
              </div>

              {tasksLoading ? (
                <div className="card">
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>
                    Loading tasks...
                  </p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="card">
                  <div style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📝</div>
                    <h3 style={{ color: "#f1f5f9", marginBottom: "0.5rem" }}>
                      No Tasks Assigned
                    </h3>
                    <p style={{ color: "#94a3b8" }}>
                      You don't have any tasks assigned to you yet
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {tasks.map((task) => (
                    <div key={task._id} className="task-card">
                      <div className="task-header">
                        <div style={{ flex: 1 }}>
                          <h3 className="task-title">{task.title}</h3>
                          <p className="task-description">{task.description}</p>
                        </div>
                      </div>

                      <div className="task-meta">
                        <span
                          className="status-badge"
                          style={{
                            background: getStatusColor(task.status).bg,
                            color: getStatusColor(task.status).color
                          }}
                        >
                          {task.status}
                        </span>

                        {task.priority && (
                          <span
                            className="status-badge"
                            style={{
                              background: getPriorityColor(task.priority).bg,
                              color: getPriorityColor(task.priority).color
                            }}
                          >
                            {task.priority} Priority
                          </span>
                        )}

                        {task.dueDate && (
                          <span style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "0.3rem 0.8rem" }}>
                            📅 Due: {formatDate(task.dueDate)}
                          </span>
                        )}

                        {task.domain && (
                          <span style={{
                            color: "#94a3b8",
                            fontSize: "0.85rem",
                            padding: "0.3rem 0.8rem",
                            background: "rgba(148,163,184,0.1)",
                            borderRadius: "20px"
                          }}>
                            {task.domain}
                          </span>
                        )}
                      </div>

                      <div className="form-group" style={{ marginTop: "1rem" }}>
                        <label className="form-label">Update Status</label>
                        <select
                          className="form-input"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                          style={{ maxWidth: "250px" }}
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                        </select>
                      </div>

                      {task.comments && task.comments.length > 0 && (
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(148,163,184,0.1)" }}>
                          <h4 style={{ color: "#f1f5f9", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                            💬 Comments ({task.comments.length})
                          </h4>
                          {task.comments.map((comment, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "rgba(15, 23, 42, 0.5)",
                                padding: "0.75rem",
                                borderRadius: "8px",
                                marginTop: "0.5rem",
                                borderLeft: "3px solid #6366f1"
                              }}
                            >
                              <p style={{ color: "#cbd5e1", fontSize: "0.9rem", margin: 0 }}>
                                {comment.text}
                              </p>
                              <small style={{ color: "#64748b", fontSize: "0.75rem" }}>
                                By {comment.addedBy} • {new Date(comment.addedAt).toLocaleString()}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {activeTab === "payroll" && (
            <>
              <div className="content-header">
                <h1 className="page-title">💰 My Payslips</h1>
                <p className="page-subtitle">View your payroll and payment history</p>
              </div>

              {/* Salary Configuration Summary */}
              {salaryConfig && (
                <div className="card">
                  <h2 className="card-title">My Salary Configuration</h2>
                  <div className="info-cards-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    <div style={{ padding: "1rem" }}>
                      <div className="stat-label">Domain</div>
                      <div className="stat-value" style={{ fontSize: "1rem" }}>
                        {salaryConfig.domain || "N/A"}
                      </div>
                    </div>
                    <div style={{ padding: "1rem" }}>
                      <div className="stat-label">Base Salary</div>
                      <div className="stat-value" style={{ fontSize: "1rem", color: "#10b981" }}>
                        ₹{salaryConfig.baseSalary.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ padding: "1rem" }}>
                      <div className="stat-label">Salary Day</div>
                      <div className="stat-value" style={{ fontSize: "1rem" }}>
                        {salaryConfig.salaryDay} of month
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payroll History */}
              <div className="card">
                <h2 className="card-title">Payroll History</h2>

                {payrollLoading ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>
                    Loading payroll data...
                  </p>
                ) : payrolls.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💰</div>
                    <h3 style={{ color: "#f1f5f9", marginBottom: "0.5rem" }}>
                      No Payroll Records
                    </h3>
                    <p style={{ color: "#94a3b8" }}>
                      Your payslips will appear here once payroll is processed
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Working Days</th>
                          <th>Present</th>
                          <th>Gross Salary</th>
                          <th>Deductions</th>
                          <th>Net Salary</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrolls.map((payroll) => (
                          <tr
                            key={payroll._id}
                            onClick={() => {
                              setSelectedPayroll(payroll);
                              setShowPayrollModal(true);
                            }}
                            style={{ cursor: "pointer" }}
                            title="Click to view details"
                          >
                            <td>
                              <strong>{formatMonth(payroll.month)} {payroll.year}</strong>
                            </td>
                            <td>{payroll.attendanceData.totalWorkingDays}</td>
                            <td>{payroll.attendanceData.presentDays}</td>
                            <td>₹{payroll.grossSalary.toFixed(2)}</td>
                            <td>₹{payroll.totalDeductions.toFixed(2)}</td>
                            <td>
                              <strong style={{ color: "#10b981" }}>
                                ₹{payroll.netSalary.toFixed(2)}
                              </strong>
                            </td>
                            <td>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPayroll(payroll);
                                  setShowPayrollModal(true);
                                }}
                                className="btn btn-primary"
                                style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Payroll Detail Modal */}
      {showPayrollModal && selectedPayroll && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#1e293b",
            padding: "2rem",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)"
          }}>
            <h2 style={{ marginBottom: "1.5rem", color: "#f1f5f9", fontSize: "1.5rem", fontWeight: "700" }}>
              Payslip for {formatMonth(selectedPayroll.month)} {selectedPayroll.year}
            </h2>

            {/* Payment Status */}
            <div style={{
              padding: "1rem",
              backgroundColor: `${getPaymentStatusColor(selectedPayroll.paymentStatus)}20`,
              borderRadius: "8px",
              marginBottom: "1.5rem"
            }}>
              <p style={{
                color: getPaymentStatusColor(selectedPayroll.paymentStatus),
                fontWeight: "bold",
                fontSize: "1.125rem"
              }}>
                Status: {selectedPayroll.paymentStatus}
              </p>
              {selectedPayroll.transactionId && (
                <p style={{ marginTop: "0.25rem", fontSize: "0.875rem" }}>
                  Transaction ID: {selectedPayroll.transactionId}
                </p>
              )}
            </div>

            {/* Earnings */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f1f5f9', marginTop: '1rem', marginBottom: '1rem' }}>Earnings</h3>
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.25rem', borderRadius: '12px', display: 'grid', gap: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <p><strong>Base Salary:</strong></p>
                <p style={{ textAlign: "right" }}>₹{selectedPayroll.baseSalary.toFixed(2)}</p>

                <p>HRA:</p>
                <p style={{ textAlign: "right" }}>₹{(selectedPayroll.allowances.hra || 0).toFixed(2)}</p>

                <p>DA:</p>
                <p style={{ textAlign: "right" }}>₹{(selectedPayroll.allowances.da || 0).toFixed(2)}</p>

                <p>Transport Allowance:</p>
                <p style={{ textAlign: "right" }}>₹{(selectedPayroll.allowances.ta || 0).toFixed(2)}</p>

                <p>Medical Allowance:</p>
                <p style={{ textAlign: "right" }}>₹{(selectedPayroll.allowances.medical || 0).toFixed(2)}</p>

                {selectedPayroll.allowances.other > 0 && (
                  <>
                    <p>Other Allowances:</p>
                    <p style={{ textAlign: "right" }}>₹{selectedPayroll.allowances.other.toFixed(2)}</p>
                  </>
                )}

                {selectedPayroll.overtimePay > 0 && (
                  <>
                    <p>Overtime Pay:</p>
                    <p style={{ textAlign: "right" }}>₹{selectedPayroll.overtimePay.toFixed(2)}</p>
                  </>
                )}

                {selectedPayroll.bonus > 0 && (
                  <>
                    <p>Bonus:</p>
                    <p style={{ textAlign: "right" }}>₹{selectedPayroll.bonus.toFixed(2)}</p>
                  </>
                )}

                <p style={{
                  fontWeight: "bold",
                  borderTop: "2px solid #10b981",
                  paddingTop: "0.5rem"
                }}>
                  Gross Salary:
                </p>
                <p style={{
                  fontWeight: "bold",
                  borderTop: "2px solid #10b981",
                  paddingTop: "0.5rem",
                  textAlign: "right",
                  color: "#10b981"
                }}>
                  ₹{selectedPayroll.grossSalary.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Deductions */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f1f5f9', marginTop: '1.5rem', marginBottom: '1rem' }}>Deductions</h3>
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.25rem', borderRadius: '12px', display: 'grid', gap: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <p>Provident Fund (PF):</p>
                <p style={{ textAlign: "right" }}>₹{(selectedPayroll.deductions.pf || 0).toFixed(2)}</p>

                <p>ESI:</p>
                <p style={{ textAlign: "right" }}>₹{(selectedPayroll.deductions.esi || 0).toFixed(2)}</p>

                <p>Income Tax:</p>
                <p style={{ textAlign: "right" }}>₹{(selectedPayroll.deductions.tax || 0).toFixed(2)}</p>

                <p>Professional Tax:</p>
                <p style={{ textAlign: "right" }}>₹{(selectedPayroll.deductions.professionalTax || 0).toFixed(2)}</p>

                {selectedPayroll.deductions.loanDeduction > 0 && (
                  <>
                    <p>Loan Deduction:</p>
                    <p style={{ textAlign: "right" }}>₹{selectedPayroll.deductions.loanDeduction.toFixed(2)}</p>
                  </>
                )}

                {selectedPayroll.deductions.other > 0 && (
                  <>
                    <p>Other Deductions:</p>
                    <p style={{ textAlign: "right" }}>₹{selectedPayroll.deductions.other.toFixed(2)}</p>
                  </>
                )}

                <p style={{
                  fontWeight: "bold",
                  borderTop: "2px solid #ef4444",
                  paddingTop: "0.5rem"
                }}>
                  Total Deductions:
                </p>
                <p style={{
                  fontWeight: "bold",
                  borderTop: "2px solid #ef4444",
                  paddingTop: "0.5rem",
                  textAlign: "right",
                  color: "#ef4444"
                }}>
                  ₹{selectedPayroll.totalDeductions.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Attendance Summary */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "0.75rem", color: "#f1f5f9", fontSize: "1.1rem" }}>Attendance Summary</h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                background: "rgba(15, 23, 42, 0.3)",
                padding: "1rem",
                borderRadius: "8px",
                color: "#cbd5e1"
              }}>
                <p>Total Working Days:</p>
                <p style={{ textAlign: "right", color: "#f1f5f9" }}>{selectedPayroll.attendanceData.totalWorkingDays}</p>

                <p>Present Days:</p>
                <p style={{ textAlign: "right", color: "#f1f5f9" }}>{selectedPayroll.attendanceData.presentDays}</p>

                <p>Absent Days:</p>
                <p style={{ textAlign: "right", color: "#f1f5f9" }}>{selectedPayroll.attendanceData.absentDays}</p>

                <p>Half Days:</p>
                <p style={{ textAlign: "right", color: "#f1f5f9" }}>{selectedPayroll.attendanceData.halfDays}</p>

                <p>Late Days:</p>
                <p style={{ textAlign: "right", color: "#f1f5f9" }}>{selectedPayroll.attendanceData.lateDays}</p>

                {selectedPayroll.attendanceData.overtimeHours > 0 && (
                  <>
                    <p>Overtime Hours:</p>
                    <p style={{ textAlign: "right", color: "#f1f5f9" }}>
                      {selectedPayroll.attendanceData.overtimeHours.toFixed(2)} hrs
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Net Salary */}
            <div style={{
              padding: "1.5rem",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "8px",
              marginBottom: "1.5rem"
            }}>
              <h3 style={{
                color: "#34d399",
                fontSize: "1.75rem",
                textAlign: "center",
                margin: 0,
                fontWeight: "800"
              }}>
                Net Salary: ₹{selectedPayroll.netSalary.toFixed(2)}
              </h3>
            </div>

            {/* Notes */}
            {selectedPayroll.notes && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ marginBottom: "0.5rem", color: "#f1f5f9", fontSize: "1.1rem" }}>Notes</h3>
                <p style={{
                  padding: "0.75rem",
                  backgroundColor: "rgba(15, 23, 42, 0.3)",
                  borderRadius: "6px",
                  color: "#cbd5e1",
                  fontSize: "0.95rem"
                }}>
                  {selectedPayroll.notes}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowPayrollModal(false)}
              className="btn btn-secondary"
              style={{ width: "100%" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EMPLOYEE DETAILS TAB */}
      {activeTab === "details" && (
        <>
          <div className="content-header">
            <h1 className="page-title">📝 Additional Employee Details</h1>
            <p className="page-subtitle">Complete your comprehensive employee profile</p>
          </div>

          {detailsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <p>Loading employee details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitEmployeeDetails}>
              {/* Personal Information Section */}
              <div className="card">
                <h2 className="card-title">👤 Personal Information</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={detailsFormData.dateOfBirth}
                      onChange={(e) => setDetailsFormData({ ...detailsFormData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-input"
                      value={detailsFormData.gender}
                      onChange={(e) => setDetailsFormData({ ...detailsFormData, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Marital Status</label>
                    <select
                      className="form-input"
                      value={detailsFormData.maritalStatus}
                      onChange={(e) => setDetailsFormData({ ...detailsFormData, maritalStatus: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-input"
                      value={detailsFormData.bloodGroup}
                      onChange={(e) => setDetailsFormData({ ...detailsFormData, bloodGroup: e.target.value })}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Details Section */}
              <div className="card">
                <h2 className="card-title">🏠 Address Details</h2>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">House/Flat No., Street</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.address.house}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        address: { ...detailsFormData.address, house: e.target.value }
                      })}
                      placeholder="Enter house/flat number and street"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.address.city}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        address: { ...detailsFormData.address, city: e.target.value }
                      })}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.address.state}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        address: { ...detailsFormData.address, state: e.target.value }
                      })}
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.address.pincode}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        address: { ...detailsFormData.address, pincode: e.target.value }
                      })}
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>
              </div>

              {/* National ID Section */}
              <div className="card">
                <h2 className="card-title">🆔 National ID Proof</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">ID Type</label>
                    <select
                      className="form-input"
                      value={detailsFormData.nationalId.type}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        nationalId: { ...detailsFormData.nationalId, type: e.target.value }
                      })}
                    >
                      <option value="">Select ID Type</option>
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="PAN">PAN</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ID Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.nationalId.number}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        nationalId: { ...detailsFormData.nationalId, number: e.target.value }
                      })}
                      placeholder="Enter ID number"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="card">
                <h2 className="card-title">🚨 Emergency Contact</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.emergencyContact.name}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        emergencyContact: { ...detailsFormData.emergencyContact, name: e.target.value }
                      })}
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={detailsFormData.emergencyContact.phone}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        emergencyContact: { ...detailsFormData.emergencyContact, phone: e.target.value }
                      })}
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.emergencyContact.relationship}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        emergencyContact: { ...detailsFormData.emergencyContact, relationship: e.target.value }
                      })}
                      placeholder="e.g., Father, Mother, Spouse"
                    />
                  </div>
                </div>
              </div>

              {/* Education Details Section */}
              <div className="card">
                <h2 className="card-title">🎓 Education Details</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Highest Qualification</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.education.highestQualification}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        education: { ...detailsFormData.education, highestQualification: e.target.value }
                      })}
                      placeholder="e.g., B.Tech, MBA, M.Sc"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course/Degree</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.education.course}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        education: { ...detailsFormData.education, course: e.target.value }
                      })}
                      placeholder="e.g., Computer Science Engineering"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">University/College</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.education.university}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        education: { ...detailsFormData.education, university: e.target.value }
                      })}
                      placeholder="Enter university/college name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year of Passing</label>
                    <input
                      type="number"
                      className="form-input"
                      value={detailsFormData.education.yearOfPassing}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        education: { ...detailsFormData.education, yearOfPassing: e.target.value }
                      })}
                      placeholder="e.g., 2023"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Percentage/CGPA</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.education.percentage}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        education: { ...detailsFormData.education, percentage: e.target.value }
                      })}
                      placeholder="e.g., 85% or 8.5 CGPA"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Details Section */}
              <div className="card">
                <h2 className="card-title">💼 Professional Details</h2>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
                    <input
                      type="checkbox"
                      checked={detailsFormData.professional.isFresher}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        professional: { ...detailsFormData.professional, isFresher: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    I am a fresher (no prior work experience)
                  </label>
                </div>

                {!detailsFormData.professional.isFresher && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Previous Company</label>
                      <input
                        type="text"
                        className="form-input"
                        value={detailsFormData.professional.previousCompany}
                        onChange={(e) => setDetailsFormData({
                          ...detailsFormData,
                          professional: { ...detailsFormData.professional, previousCompany: e.target.value }
                        })}
                        placeholder="Enter previous company name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Years of Experience</label>
                      <input
                        type="number"
                        className="form-input"
                        value={detailsFormData.professional.yearsOfExperience}
                        onChange={(e) => setDetailsFormData({
                          ...detailsFormData,
                          professional: { ...detailsFormData.professional, yearsOfExperience: e.target.value }
                        })}
                        placeholder="e.g., 3"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Job Role</label>
                      <input
                        type="text"
                        className="form-input"
                        value={detailsFormData.professional.lastJobRole}
                        onChange={(e) => setDetailsFormData({
                          ...detailsFormData,
                          professional: { ...detailsFormData.professional, lastJobRole: e.target.value }
                        })}
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                  </div>
                )}

                <div className="form-grid" style={{ marginTop: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Skills (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.professional.skills}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        professional: { ...detailsFormData.professional, skills: e.target.value }
                      })}
                      placeholder="e.g., JavaScript, React, Node.js, MongoDB"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">LinkedIn Profile</label>
                    <input
                      type="url"
                      className="form-input"
                      value={detailsFormData.professional.linkedIn}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        professional: { ...detailsFormData.professional, linkedIn: e.target.value }
                      })}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Portfolio Link</label>
                    <input
                      type="url"
                      className="form-input"
                      value={detailsFormData.professional.portfolio}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        professional: { ...detailsFormData.professional, portfolio: e.target.value }
                      })}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="card">
                <h2 className="card-title">🏦 Bank & Salary Details</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.bankDetails.bankName}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        bankDetails: { ...detailsFormData.bankDetails, bankName: e.target.value }
                      })}
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.bankDetails.accountNumber}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        bankDetails: { ...detailsFormData.bankDetails, accountNumber: e.target.value }
                      })}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.bankDetails.ifscCode}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        bankDetails: { ...detailsFormData.bankDetails, ifscCode: e.target.value }
                      })}
                      placeholder="Enter IFSC code"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.bankDetails.branch}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        bankDetails: { ...detailsFormData.bankDetails, branch: e.target.value }
                      })}
                      placeholder="Enter branch name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">UPI ID (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.bankDetails.upiId}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        bankDetails: { ...detailsFormData.bankDetails, upiId: e.target.value }
                      })}
                      placeholder="yourname@upi"
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', color: '#f1f5f9', marginTop: '1.5rem', marginBottom: '1rem' }}>Salary Components</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Basic Salary</label>
                    <input
                      type="number"
                      className="form-input"
                      value={detailsFormData.salaryDetails.basicSalary}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        salaryDetails: { ...detailsFormData.salaryDetails, basicSalary: e.target.value }
                      })}
                      placeholder="Enter basic salary"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HRA</label>
                    <input
                      type="number"
                      className="form-input"
                      value={detailsFormData.salaryDetails.hra}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        salaryDetails: { ...detailsFormData.salaryDetails, hra: e.target.value }
                      })}
                      placeholder="House Rent Allowance"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DA</label>
                    <input
                      type="number"
                      className="form-input"
                      value={detailsFormData.salaryDetails.da}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        salaryDetails: { ...detailsFormData.salaryDetails, da: e.target.value }
                      })}
                      placeholder="Dearness Allowance"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Other Allowances</label>
                    <input
                      type="number"
                      className="form-input"
                      value={detailsFormData.salaryDetails.otherAllowances}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        salaryDetails: { ...detailsFormData.salaryDetails, otherAllowances: e.target.value }
                      })}
                      placeholder="Other allowances"
                    />
                  </div>
                </div>
              </div>

              {/* Job Details Section */}
              <div className="card">
                <h2 className="card-title">💻 Job Details</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.jobDetails.department}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        jobDetails: { ...detailsFormData.jobDetails, department: e.target.value }
                      })}
                      placeholder="e.g., Engineering, HR, Sales"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.jobDetails.designation}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        jobDetails: { ...detailsFormData.jobDetails, designation: e.target.value }
                      })}
                      placeholder="e.g., Software Engineer, Manager"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Joining</label>
                    <input
                      type="date"
                      className="form-input"
                      value={detailsFormData.jobDetails.dateOfJoining}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        jobDetails: { ...detailsFormData.jobDetails, dateOfJoining: e.target.value }
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Work Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.jobDetails.workLocation}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        jobDetails: { ...detailsFormData.jobDetails, workLocation: e.target.value }
                      })}
                      placeholder="e.g., Bangalore, Remote"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shift Timing</label>
                    <input
                      type="text"
                      className="form-input"
                      value={detailsFormData.jobDetails.shiftTiming}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        jobDetails: { ...detailsFormData.jobDetails, shiftTiming: e.target.value }
                      })}
                      placeholder="e.g., 9 AM - 6 PM"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employment Type</label>
                    <select
                      className="form-input"
                      value={detailsFormData.jobDetails.employmentType}
                      onChange={(e) => setDetailsFormData({
                        ...detailsFormData,
                        jobDetails: { ...detailsFormData.jobDetails, employmentType: e.target.value }
                      })}
                    >
                      <option value="">Select Employment Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="btn-group" style={{ marginTop: '2rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={detailsLoading}
                  style={{ minWidth: '200px' }}
                >
                  {detailsLoading ? "Submitting..." : employeeDetails ? "Update Details" : "Submit Details"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* LEAVE APPLICATION MODAL */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
            <div className="edit-form-header">
              <h2 className="edit-form-title">
                <Calendar size={24} style={{ marginRight: '10px', verticalAlign: 'middle', color: '#3b82f6' }} />
                Apply for Leave
              </h2>
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleApplyLeave}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Leave Type</label>
                <select
                  className="form-input"
                  value={leaveFormData.leaveType}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value })}
                  required
                >
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Annual">Annual Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={leaveFormData.startDate}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={leaveFormData.endDate}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Reason</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  placeholder="Describe your reason for leave..."
                  required
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLeaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={leaveLoading}
                >
                  {leaveLoading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeDashboard;