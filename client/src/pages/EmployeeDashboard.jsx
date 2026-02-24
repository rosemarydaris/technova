import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Briefcase, Phone, Calendar, Edit3,
  CheckCircle, X, LogOut, Bell, Clipboard, DollarSign,
  Clock, MapPin, Shield, Camera, Activity, PlayCircle, StopCircle
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import ProfileCompletionBar from "../components/ProfileCompletionBar";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", message: "", type: "primary", onConfirm: () => { } });

  // Employee Details State
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(null);
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
    jobDetails: { department: "", designation: "", dateOfJoining: "", workLocation: "", shiftTiming: "", employmentType: "Full-time" }
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

  const [liveTime, setLiveTime] = useState("00:00:00");
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (todayStatus?.checkIn && !todayStatus?.checkOut) {
      interval = setInterval(() => {
        const start = new Date(todayStatus.checkIn);
        const now = new Date();
        const diff = now - start;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setLiveTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else if (todayStatus?.workingHours) {
      const h = Math.floor(todayStatus.workingHours);
      const m = Math.round((todayStatus.workingHours - h) * 60);
      setLiveTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
    } else {
      setLiveTime("00:00:00");
    }
    return () => clearInterval(interval);
  }, [todayStatus]);
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
    if (activeTab === "profile") {
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

  const handleCheckIn = () => {
    setConfirmConfig({
      title: "Confirm Check In",
      message: "Are you sure you want to Check In?",
      type: "success",
      onConfirm: async () => {
        try {
          const res = await axios.post(
            "http://localhost:5001/api/attendance/check-in",
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert(res.data.message);
          fetchTodayStatus();
          fetchAttendanceHistory();
          setShowConfirm(false);
        } catch (err) {
          alert(err.response?.data?.message || "Check-in failed");
          setShowConfirm(false);
        }
      }
    });
    setShowConfirm(true);
  };

  const handleCheckOut = () => {
    setConfirmConfig({
      title: "Confirm Check Out",
      message: "Are you sure you want to Check Out?",
      type: "primary",
      onConfirm: async () => {
        try {
          const res = await axios.post(
            "http://localhost:5001/api/attendance/check-out",
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert(res.data.message);
          fetchTodayStatus();
          fetchAttendanceHistory();
          setShowConfirm(false);
        } catch (err) {
          alert(err.response?.data?.message || "Check-out failed");
          setShowConfirm(false);
        }
      }
    });
    setShowConfirm(true);
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

      // Extract profile completion if available
      if (res.data.profileCompletion) {
        setProfileCompletion(res.data.profileCompletion);
      }

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
      // If error response contains profile completion, set it
      if (err.response?.data?.profileCompletion) {
        setProfileCompletion(err.response.data.profileCompletion);
      }
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

        .section-block {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        .section-title-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f1f5f9;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .info-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .info-value {
          font-size: 1.1rem;
          color: #e2e8f0;
          font-weight: 500;
        }
        
        .skill-tag {
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          color: #60a5fa;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-block;
          margin-right: 0.75rem;
          margin-bottom: 0.75rem;
          transition: all 0.3s ease;
        }
        .skill-tag:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
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

        /* Enhanced Attendance UI */
        .attendance-command-center {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1200px) {
          .attendance-command-center { grid-template-columns: 1fr; }
        }

        .attendance-stats-v2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .stat-card-v2 {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.3s ease;
        }

        .stat-card-v2:hover {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-5px);
        }

        .stat-icon-v2 {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .stat-content-v2 {
          display: flex;
          flex-direction: column;
        }

        .stat-label-v2 {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-value-v2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f1f5f9;
        }

        .command-action-zone {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 24px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .command-action-zone::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .live-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .status-pulse {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .main-attendance-btn {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .main-attendance-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.6);
        }

        .main-attendance-btn.check-out {
          background: linear-gradient(135deg, #f43f5e, #e11d48);
          box-shadow: 0 10px 25px rgba(244, 63, 94, 0.4);
        }

        .main-attendance-btn.check-out:hover {
          box-shadow: 0 15px 35px rgba(244, 63, 94, 0.6);
        }

        .shift-timer {
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: 2px;
        }

        /* Enhanced Tasks UI */
        .tasks-overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .task-stat-card {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .task-stat-card:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(15, 23, 42, 0.6);
        }

        .task-stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #f1f5f9;
          margin-bottom: 0.25rem;
          display: block;
        }

        .task-stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .professional-task-card {
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .professional-task-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .priority-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
        }

        .task-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .task-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 0.5rem;
        }

        .task-card-desc {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .task-badges-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .professional-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .comment-thread {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 12px;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }

        .comment-item-v2 {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .comment-avatar-v2 {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .comment-bubble-v2 {
          flex: 1;
          background: rgba(30, 41, 59, 0.7);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .comment-meta-v2 {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.4rem;
          font-size: 0.75rem;
        }

        .comment-author-v2 {
          font-weight: 700;
          color: #e2e8f0;
        }

        .comment-time-v2 {
          color: #64748b;
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
              <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                <div>
                  <h1 className="page-title">My Profile</h1>
                  <p className="page-subtitle">View and manage your personal information</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {!editMode && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setEditMode(true)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      <Edit3 size={16} style={{ marginRight: '8px' }} />
                      Edit Profile
                    </button>
                  )}
                  {profileCompletion && (
                    <div style={{ flexShrink: 0 }}>
                      <ProfileCompletionBar
                        percentage={profileCompletion.percentage}
                        size="medium"
                        showLabel={true}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Professional Profile View */}
              {profile && (
                <div style={{ marginTop: '1rem' }}>
                  {!editMode ? (
                    <>
                      <div className="section-block glass-card">
                        <div className="section-header">
                          <Briefcase className="text-primary" size={20} />
                          <h3 className="section-title-text">Corporate Identity</h3>
                        </div>
                        <div className="info-grid">
                          <div className="info-item">
                            <label className="info-label">Full Name</label>
                            <div className="info-value">{profile.fullName}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Specialization</label>
                            <div className="info-value">{profile.domain || "N/A"}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Corporate Email</label>
                            <div className="info-value">{profile.email}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Department</label>
                            <div className="info-value">{employeeDetails?.jobDetails?.department || "General"}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Designation</label>
                            <div className="info-value">{employeeDetails?.jobDetails?.designation || "Member"}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Employment Type</label>
                            <div className="info-value">{employeeDetails?.jobDetails?.employmentType || "Full-time"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="section-block glass-card">
                        <div className="section-header">
                          <User className="text-primary" size={20} />
                          <h3 className="section-title-text">Personal Background</h3>
                        </div>
                        <div className="info-grid">
                          <div className="info-item">
                            <label className="info-label">Date of Birth</label>
                            <div className="info-value">{employeeDetails?.dateOfBirth ? formatDate(employeeDetails.dateOfBirth) : "Not shared"}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Gender</label>
                            <div className="info-value">{employeeDetails?.gender || "Not shared"}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Marital Status</label>
                            <div className="info-value">{employeeDetails?.maritalStatus || "Not shared"}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Blood Group</label>
                            <div className="info-value">{employeeDetails?.bloodGroup || "Not shared"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="section-block glass-card">
                        <div className="section-header">
                          <Phone className="text-primary" size={20} />
                          <h3 className="section-title-text">Connectivity & Address</h3>
                        </div>
                        <div className="info-grid">
                          <div className="info-item">
                            <label className="info-label">Phone Connection</label>
                            <div className="info-value">{profile.phone || "Not linked"}</div>
                          </div>
                          <div className="info-item">
                            <label className="info-label">Current Address</label>
                            <div className="info-value">
                              {employeeDetails?.address ?
                                `${employeeDetails.address.house}, ${employeeDetails.address.city}, ${employeeDetails.address.state} - ${employeeDetails.address.pincode}`
                                : "No address registered"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {employeeDetails?.professional?.skills?.length > 0 && (
                        <div className="section-block glass-card">
                          <div className="section-header">
                            <Shield className="text-primary" size={20} />
                            <h3 className="section-title-text">Skills & Expertise</h3>
                          </div>
                          <div>
                            {employeeDetails.professional.skills.map((skill, index) => (
                              <span key={index} className="skill-tag">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
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


                  {/* Additional Details Section - Merged from Details Tab */}
                  <div style={{ marginTop: '2rem' }}>
                    <div className="content-header" style={{ marginBottom: '1.5rem' }}>
                      <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Additional Details</h2>
                      <p className="page-subtitle">Complete your profile for better experience</p>
                    </div>

                    {detailsLoading ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        <p>Loading details...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitEmployeeDetails}>
                        {/* Personal & Address Information */}
                        <div className="section-block glass-card">
                          <div className="section-header">
                            <User className="text-primary" size={20} />
                            <h3 className="section-title-text">Personal & Address Information</h3>
                          </div>
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

                            <div className="form-group">
                              <label className="form-label">House/Flat No.</label>
                              <input
                                type="text"
                                className="form-input"
                                value={detailsFormData.address.house}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  address: { ...detailsFormData.address, house: e.target.value }
                                })}
                                placeholder="Enter house/flat number"
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


                        {/* Identification & Emergency */}
                        <div className="section-block glass-card">
                          <div className="section-header">
                            <Shield className="text-primary" size={20} />
                            <h3 className="section-title-text">Identification & Emergency</h3>
                          </div>
                          <div className="form-grid">
                            <div className="form-group">
                              <label className="form-label">National ID Type</label>
                              <select
                                className="form-input"
                                value={detailsFormData.nationalId.type}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  nationalId: { ...detailsFormData.nationalId, type: e.target.value }
                                })}
                              >
                                <option value="">Select ID Type</option>
                                <option value="Aadhaar">Aadhaar Card</option>
                                <option value="PAN">PAN Card</option>
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
                            <div className="form-group">
                              <label className="form-label">Emergency Contact Name</label>
                              <input
                                type="text"
                                className="form-input"
                                value={detailsFormData.emergencyContact.name}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  emergencyContact: { ...detailsFormData.emergencyContact, name: e.target.value }
                                })}
                                placeholder="Enter contact name"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Emergency Phone</label>
                              <input
                                type="tel"
                                className="form-input"
                                value={detailsFormData.emergencyContact.phone}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  emergencyContact: { ...detailsFormData.emergencyContact, phone: e.target.value }
                                })}
                                placeholder="Enter phone number"
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
                                placeholder="e.g., Father, Spouse"
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

                        {/* Professional & Salary */}
                        <div className="section-block glass-card">
                          <div className="section-header">
                            <Briefcase className="text-primary" size={20} />
                            <h3 className="section-title-text">Experience & Financials</h3>
                          </div>
                          <div className="form-grid">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                              <label className="form-label">Professional Summary & Skills</label>
                              <input
                                type="text"
                                className="form-input"
                                value={detailsFormData.professional.skills}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  professional: { ...detailsFormData.professional, skills: e.target.value }
                                })}
                                placeholder="e.g., JavaScript, React, Leadership, SEO"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">LinkedIn Profile URL</label>
                              <input
                                type="url"
                                className="form-input"
                                value={detailsFormData.professional.linkedIn}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  professional: { ...detailsFormData.professional, linkedIn: e.target.value }
                                })}
                                placeholder="https://linkedin.com/in/username"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Portfolio URL</label>
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

                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                  type="checkbox"
                                  checked={detailsFormData.professional.isFresher}
                                  onChange={(e) => setDetailsFormData({
                                    ...detailsFormData,
                                    professional: { ...detailsFormData.professional, isFresher: e.target.checked }
                                  })}
                                />
                                I am a Fresher
                              </label>
                            </div>

                            {!detailsFormData.professional.isFresher && (
                              <>
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
                                    placeholder="Enter previous company"
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
                                    placeholder="Enter last role"
                                  />
                                </div>
                              </>
                            )}

                            <div className="form-group">
                              <label className="form-label">Total Years of Experience</label>
                              <input
                                type="number"
                                className="form-input"
                                value={detailsFormData.professional.yearsOfExperience}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  professional: { ...detailsFormData.professional, yearsOfExperience: e.target.value }
                                })}
                                placeholder="Years"
                              />
                            </div>

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
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Branch Name</label>
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
                              <label className="form-label">UPI ID</label>
                              <input
                                type="text"
                                className="form-input"
                                value={detailsFormData.bankDetails.upiId}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  bankDetails: { ...detailsFormData.bankDetails, upiId: e.target.value }
                                })}
                                placeholder="username@upi"
                              />
                            </div>

                          </div>
                        </div>

                        {/* Job Specifics */}
                        <div className="section-block glass-card">
                          <div className="section-header">
                            <Shield className="text-primary" size={20} />
                            <h3 className="section-title-text">Corporate Assignment</h3>
                          </div>
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
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Date of Joining</label>
                              <input
                                type="date"
                                className="form-input"
                                value={detailsFormData.jobDetails.dateOfJoining ? new Date(detailsFormData.jobDetails.dateOfJoining).toISOString().split('T')[0] : ""}
                                onChange={(e) => setDetailsFormData({
                                  ...detailsFormData,
                                  jobDetails: { ...detailsFormData.jobDetails, dateOfJoining: e.target.value }
                                })}
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
                                placeholder="e.g., 9:00 AM - 6:00 PM"
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
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                              </select>
                            </div>

                          </div>
                        </div>


                        {/* Save Button */}
                        <div className="btn-group" style={{ marginTop: '2rem' }}>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={detailsLoading}
                            style={{ minWidth: '200px' }}
                          >
                            {detailsLoading ? "Saving..." : employeeDetails ? "Update Details" : "Save Details"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </>
          )}


          {activeTab === "attendance" && (
            <>
              <div className="content-header">
                <h1 className="page-title">Attendance Command Center</h1>
                <p className="page-subtitle">Real-time tracking and automated shift monitoring</p>
              </div>

              <div className="attendance-command-center">
                <div className="attendance-stats-v2">
                  <div className="stat-card-v2">
                    <div className="stat-icon-v2">
                      <Activity size={24} />
                    </div>
                    <div className="stat-content-v2">
                      <span className="stat-label-v2">Daily Status</span>
                      <span className="stat-value-v2" style={{ color: todayStatus?.checkIn ? '#10b981' : '#94a3b8' }}>
                        {todayStatus?.checkIn ? todayStatus.status : "Waiting..."}
                      </span>
                    </div>
                  </div>

                  <div className="stat-card-v2">
                    <div className="stat-icon-v2">
                      <PlayCircle size={24} style={{ color: '#10b981' }} />
                    </div>
                    <div className="stat-content-v2">
                      <span className="stat-label-v2">Check In Time</span>
                      <span className="stat-value-v2">{formatTime(todayStatus?.checkIn) || "— : —"}</span>
                    </div>
                  </div>

                  <div className="stat-card-v2">
                    <div className="stat-icon-v2">
                      <StopCircle size={24} style={{ color: '#f43f5e' }} />
                    </div>
                    <div className="stat-content-v2">
                      <span className="stat-label-v2">Check Out Time</span>
                      <span className="stat-value-v2">{formatTime(todayStatus?.checkOut) || "— : —"}</span>
                    </div>
                  </div>

                  <div className="stat-card-v2">
                    <div className="stat-icon-v2">
                      <Clock size={24} style={{ color: '#fbbf24' }} />
                    </div>
                    <div className="stat-content-v2">
                      <span className="stat-label-v2">Logged Hours</span>
                      <span className="stat-value-v2">{todayStatus?.workingHours?.toFixed(2) || "0.00"} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="command-action-zone glass-card">
                  <div className="live-status-badge">
                    <div className="status-pulse" style={{ background: todayStatus?.checkIn && !todayStatus?.checkOut ? '#10b981' : '#94a3b8' }}></div>
                    {todayStatus?.checkIn && !todayStatus?.checkOut ? "LIVE SESSION ACTIVE" : "SESSION INACTIVE"}
                  </div>

                  {!todayStatus?.checkIn ? (
                    <button className="main-attendance-btn" onClick={handleCheckIn}>
                      <PlayCircle size={40} />
                      CHECK IN
                    </button>
                  ) : !todayStatus?.checkOut ? (
                    <button className="main-attendance-btn check-out" onClick={handleCheckOut}>
                      <StopCircle size={40} />
                      CHECK OUT
                    </button>
                  ) : (
                    <div className="main-attendance-btn" style={{ background: '#10b981', cursor: 'default' }}>
                      <CheckCircle size={40} />
                      DONE
                    </div>
                  )}

                  <div className="shift-timer">
                    {liveTime}
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '1rem' }}>
                    Current Shift Duration
                  </p>
                </div>
              </div>

              <div className="section-block glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div className="section-header" style={{ marginBottom: 0, border: 'none', padding: 0 }}>
                    <Calendar className="text-primary" size={20} />
                    <h3 className="section-title-text" style={{ margin: 0 }}>Leave Management</h3>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowLeaveModal(true)}>
                    <Calendar size={18} /> Apply for New Leave
                  </button>
                </div>

                <div className="info-grid">
                  <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
                    <div className="stat-label">Total Leaves Taken</div>
                    <div className="stat-value" style={{ color: '#f59e0b' }}>{leaveBalance.used}</div>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>Current Calendar Year</p>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)' }}>
                    <div className="stat-label">Remaining Balance</div>
                    <div className="stat-value" style={{ color: '#3b82f6' }}>{leaveBalance.remaining || 0}</div>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>Available for use</p>
                  </div>
                </div>
              </div>

              <div className="section-block glass-card">
                <div className="section-header">
                  <Activity className="text-primary" size={20} />
                  <h3 className="section-title-text">Attendance & Leave History</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '1rem' }}>Recent Attendance</h4>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>In / Out</th>
                          <th>Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.slice(0, 5).map((record) => (
                          <tr key={record._id}>
                            <td style={{ fontSize: '0.85rem' }}>{formatDate(record.date)}</td>
                            <td style={{ fontSize: '0.85rem' }}>{formatTime(record.checkIn)} - {formatTime(record.checkOut) || "—"}</td>
                            <td style={{ fontSize: '0.85rem' }}>{record.workingHours?.toFixed(2) || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 style={{ color: '#f1f5f9', marginBottom: '1rem' }}>Leave History</h4>
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Duration</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.slice(0, 5).map((leave) => (
                          <tr key={leave._id}>
                            <td style={{ fontSize: '0.85rem' }}>{leave.leaveType}</td>
                            <td style={{ fontSize: '0.85rem' }}>{formatDate(leave.startDate)}</td>
                            <td>
                              <span className={`status-badge status-${leave.status.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}


          {activeTab === "tasks" && (
            <>
              <div className="content-header">
                <h1 className="page-title">Task Management Center</h1>
                <p className="page-subtitle">Track, update and collaborate on your delegated goals</p>
              </div>

              {tasksLoading ? (
                <div style={{ textAlign: "center", padding: "4rem" }}>
                  <div className="status-pulse" style={{ margin: "0 auto 1rem", width: '12px', height: '12px' }}></div>
                  <p style={{ color: "#94a3b8" }}>Syncing your task board...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="section-block glass-card" style={{ textAlign: "center", padding: "5rem" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "2rem", opacity: 0.5 }}>🎯</div>
                  <h3 style={{ color: "#f1f5f9", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Clear Horizon</h3>
                  <p style={{ color: "#94a3b8" }}>You have no active tasks assigned at the moment.</p>
                </div>
              ) : (
                <>
                  {/* Tasks Overview Header */}
                  <div className="tasks-overview-grid">
                    <div className="task-stat-card">
                      <span className="task-stat-value">{tasks.length}</span>
                      <span className="task-stat-label">Total Assigned</span>
                    </div>
                    <div className="task-stat-card">
                      <span className="task-stat-value" style={{ color: '#fbbf24' }}>
                        {tasks.filter(t => t.status === 'Pending').length}
                      </span>
                      <span className="task-stat-label">Pending</span>
                    </div>
                    <div className="task-stat-card">
                      <span className="task-stat-value" style={{ color: '#3b82f6' }}>
                        {tasks.filter(t => t.status === 'In Progress').length}
                      </span>
                      <span className="task-stat-label">In Progress</span>
                    </div>
                    <div className="task-stat-card">
                      <span className="task-stat-value" style={{ color: '#10b981' }}>
                        {tasks.filter(t => t.status === 'Completed').length}
                      </span>
                      <span className="task-stat-label">Completed</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {tasks.map((task) => {
                      const priorityColor = task.priority === 'High' ? '#f43f5e' : task.priority === 'Medium' ? '#fbbf24' : '#3b82f6';
                      return (
                        <div key={task._id} className="professional-task-card">
                          <div className="priority-indicator" style={{ background: priorityColor }}></div>

                          <div className="task-card-header">
                            <div>
                              <h3 className="task-card-title">{task.title}</h3>
                              <p className="task-card-desc">{task.description}</p>
                            </div>
                            <select
                              className="form-input"
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                              style={{
                                width: 'auto',
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.8rem',
                                background: 'rgba(15, 23, 42, 0.6)',
                                borderRadius: '8px'
                              }}
                            >
                              <option>Pending</option>
                              <option>In Progress</option>
                              <option>Completed</option>
                            </select>
                          </div>

                          <div className="task-badges-row">
                            <div className="professional-badge" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}>
                              <Calendar size={14} />
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </div>
                            <div className="professional-badge" style={{
                              background: `${priorityColor}15`,
                              color: priorityColor,
                              border: `1px solid ${priorityColor}30`
                            }}>
                              <Shield size={14} />
                              <span>{task.priority} Priority</span>
                            </div>
                            {task.domain && (
                              <div className="professional-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                                <Briefcase size={14} />
                                <span>{task.domain}</span>
                              </div>
                            )}
                          </div>

                          {task.comments && task.comments.length > 0 && (
                            <div className="comment-thread">
                              <h4 style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>
                                Activity & Discussion
                              </h4>
                              {task.comments.map((comment, idx) => (
                                <div key={idx} className="comment-item-v2">
                                  <div className="comment-avatar-v2">
                                    {comment.addedBy.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="comment-bubble-v2">
                                    <div className="comment-meta-v2">
                                      <span className="comment-author-v2">{comment.addedBy}</span>
                                      <span className="comment-time-v2">{new Date(comment.addedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0 }}>
                                      {comment.text}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

      {/* LEAVE APPLICATION MODAL */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="edit-form-header">
              <h2 className="edit-form-title">Apply for Leave</h2>
              <button onClick={() => setShowLeaveModal(false)} className="btn-icon">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleApplyLeave}>
              <div className="form-grid">
                <div className="form-group">
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
                    <option value="Half Day">Half Day</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>
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
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  placeholder="Please provide a reason for your leave request..."
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="btn btn-secondary"
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

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </>
  );
};

export default EmployeeDashboard;