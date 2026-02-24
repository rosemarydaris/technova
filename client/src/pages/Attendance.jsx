import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LeaveApplicationModal from "../components/LeaveApplicationModal";
import ConfirmationModal from "../components/ConfirmationModal";

const Attendance = () => {
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("Monthly"); // Daily, Weekly, Monthly
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", message: "", type: "primary", onConfirm: () => { } });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTodayStatus();
    fetchAttendanceHistory();
    fetchMyLeaves();
    fetchLeaveBalance();
  }, [token, navigate]);

  // ================= FETCH TODAY'S STATUS =================
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

  // ================= FETCH ATTENDANCE HISTORY =================
  const fetchAttendanceHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/attendance/my-attendance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceHistory(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ================= FETCH MY LEAVES =================
  const fetchMyLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/leave/my-leaves", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FETCH LEAVE BALANCE =================
  const fetchLeaveBalance = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/leave/balance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveBalance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= CHECK IN =================
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

  // ================= CHECK OUT =================
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

  // ================= FORMAT DATE/TIME =================
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getFilteredHistory = () => {
    if (!attendanceHistory) return [];

    const now = new Date();
    return attendanceHistory.filter(record => {
      const recordDate = new Date(record.date);
      if (viewMode === "Daily") {
        return recordDate.getDate() === now.getDate() &&
          recordDate.getMonth() === now.getMonth() &&
          recordDate.getFullYear() === now.getFullYear();
      } else if (viewMode === "Weekly") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return recordDate >= oneWeekAgo;
      } else {
        // Monthly (default) or others
        return recordDate.getMonth() === now.getMonth() &&
          recordDate.getFullYear() === now.getFullYear();
      }
    });
  };

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container { padding: 2rem; background: #f3f4f6; min-height: 100vh; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .dashboard-title { font-size: 2rem; font-weight: 700; color: #1f2937; }
        .btn-secondary { background: #e5e7eb; color: #374151; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn-success { background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        
        .grid-container { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
        
        .dashboard-section { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 2rem; }
        .section-title { font-size: 1.25rem; font-weight: 600; color: #374151; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
        
        .profile-card { text-align: center; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.5rem; }
        .info-label { color: #6b7280; font-size: 0.9rem; }
        .info-value { font-weight: 600; color: #1f2937; }

        .balance-card { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; }
        .balance-title { font-size: 1rem; opacity: 0.9; margin-bottom: 0.5rem; }
        .balance-value { font-size: 2.5rem; font-weight: 700; }
        .balance-subtitle { font-size: 0.9rem; opacity: 0.8; }

        .view-filters { display: flex; gap: 0.5rem; background: #f3f4f6; padding: 0.25rem; border-radius: 8px; }
        .filter-btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #6b7280; font-size: 0.9rem; font-weight: 500; }
        .filter-btn.active { background: white; color: #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
        .status-badge.approved { background: #d1fae5; color: #065f46; }
        .status-badge.pending { background: #fef3c7; color: #92400e; }
        .status-badge.rejected { background: #fee2e2; color: #991b1b; }

        @media (max-width: 1024px) { .grid-container { grid-template-columns: 1fr; } }
      `}</style>

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">📅 Attendance & Leave</h1>
          <p style={{ color: '#6b7280' }}>Track your daily attendance and manage leaves</p>
        </div>
        <button
          onClick={() => navigate("/employee-dashboard")}
          className="btn-secondary"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid-container">
        {/* LEFT COLUMN */}
        <div className="left-column">

          {/* TODAY'S STATUS */}
          <section className="dashboard-section">
            <h2 className="section-title">Today's Status</h2>
            {todayStatus && todayStatus.checkIn ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <div className="info-label">Status</div>
                  <div className="info-value" style={{
                    color: todayStatus.status === "Present" ? "#10b981" : "#f59e0b"
                  }}>
                    {todayStatus.status}
                  </div>
                </div>
                <div>
                  <div className="info-label">Check In</div>
                  <div className="info-value">{formatTime(todayStatus.checkIn)}</div>
                </div>
                <div>
                  <div className="info-label">Check Out</div>
                  <div className="info-value">{formatTime(todayStatus.checkOut)}</div>
                </div>
                <div>
                  {!todayStatus.checkOut && (
                    <button onClick={handleCheckOut} className="btn-primary" style={{ width: '100%' }}>
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ marginBottom: "1rem", color: '#6b7280' }}>You haven't checked in today yet.</p>
                <button onClick={handleCheckIn} className="btn-success">
                  Check In Now
                </button>
              </div>
            )}
          </section>

          {/* ATTENDANCE HISTORY */}
          <section className="dashboard-section">
            <div className="section-title">
              Attendance History
              <div className="view-filters">
                {["Daily", "Weekly", "Monthly"].map(mode => (
                  <button
                    key={mode}
                    className={`filter-btn ${viewMode === mode ? 'active' : ''}`}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : getFilteredHistory().length === 0 ? (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No records found for this period.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f3f4f6", textAlign: 'left' }}>
                      <th style={{ padding: '10px', color: '#6b7280' }}>Date</th>
                      <th style={{ padding: '10px', color: '#6b7280' }}>Check In</th>
                      <th style={{ padding: '10px', color: '#6b7280' }}>Check Out</th>
                      <th style={{ padding: '10px', color: '#6b7280' }}>Hours</th>
                      <th style={{ padding: '10px', color: '#6b7280' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredHistory().map((record) => (
                      <tr key={record._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: '12px' }}>{formatDate(record.date)}</td>
                        <td style={{ padding: '12px' }}>{formatTime(record.checkIn)}</td>
                        <td style={{ padding: '12px' }}>{formatTime(record.checkOut)}</td>
                        <td style={{ padding: '12px' }}>
                          {record.workingHours ? record.workingHours.toFixed(2) : "—"}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            backgroundColor: record.status === "Present" ? "#d1fae5" : "#f3f4f6",
                            color: record.status === "Present" ? "#065f46" : "#374151",
                            fontSize: '0.85rem'
                          }}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">

          {/* LEAVE BALANCE CARD */}
          <div className="balance-card">
            <div className="balance-title">Annual Leave Balance</div>
            <div className="balance-value">
              {leaveBalance ? leaveBalance.remaining : "--"}
              <span style={{ fontSize: '1rem', fontWeight: '400', opacity: 0.8 }}> days</span>
            </div>
            <div className="balance-subtitle">
              Used: {leaveBalance ? leaveBalance.used : 0} of {leaveBalance ? leaveBalance.total : 0} days
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              style={{
                marginTop: '1.5rem',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: '600'
              }}
            >
              + Apply for Leave
            </button>
          </div>

          {/* MY LEAVE REQUESTS */}
          <section className="dashboard-section">
            <h2 className="section-title">Recent Requests</h2>
            {myLeaves.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No leave requests found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myLeaves.slice(0, 5).map(leave => (
                  <div key={leave._id} style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{leave.leaveType}</span>
                      <span className={`status-badge ${leave.status.toLowerCase()}`}>
                        {leave.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {showLeaveModal && (
        <LeaveApplicationModal
          onClose={() => setShowLeaveModal(false)}
          onSuccess={() => {
            fetchMyLeaves();
            fetchLeaveBalance();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
};

export default Attendance;