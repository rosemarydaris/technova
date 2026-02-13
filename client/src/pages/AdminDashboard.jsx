import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminTasks from "./AdminTasks";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDomain, setFilterDomain] = useState("all");
  const [allAttendance, setAllAttendance] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchEmployees();
      fetchAllAttendance();
      fetchAllLeaves();
    }
  }, [token, navigate]);

  const fetchAllLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/leave/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllLeaves(res.data);
    } catch (err) {
      console.error("Error fetching leaves:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/admin/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setLoading(false);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  const fetchAllAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/attendance/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllAttendance(res.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const viewProfile = (emp) => {
    setSelectedEmployee(emp);
    setIsEditing(false);
    setEditForm({
      fullName: emp.fullName,
      email: emp.email,
      company: emp.company,
      phone: emp.phone,
      domain: emp.domain,
    });
  };

  const saveChanges = async () => {
    try {
      await axios.put(
        `http://localhost:5001/api/admin/employee/${selectedEmployee._id}`,
        editForm,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchEmployees();
      setSelectedEmployee({ ...selectedEmployee, ...editForm });
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5001/api/admin/employee/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmployees();
      setSelectedEmployee(null);
      alert("Employee deleted successfully");
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("Failed to delete employee");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleLeaveStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5001/api/leave/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Leave ${status.toLowerCase()} successfully`);
      fetchAllLeaves();
    } catch (err) {
      console.error("Error updating leave status:", err);
      alert("Failed to update leave status");
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave record? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5001/api/leave/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Leave record deleted successfully");
      fetchAllLeaves();
    } catch (err) {
      console.error("Error deleting leave:", err);
      alert("Failed to delete leave record");
    }
  };

  const fetchEmployeeDetails = async (userId) => {
    try {
      setDetailsLoading(true);
      const res = await axios.get(`http://localhost:5001/api/employee-details/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeDetails(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching employee details:", err);
      if (err.response?.status === 404) {
        alert("This employee has not submitted additional details yet.");
      } else {
        alert("Failed to fetch employee details");
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredEmployees = employees
    .filter((e) => e.email !== "admin@technova.com")
    .filter((e) => {
      const matchSearch =
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDomain = filterDomain === "all" || e.domain === filterDomain;
      return matchSearch && matchDomain;
    });

  const domains = [...new Set(
    employees
      .filter(e => e.email !== "admin@technova.com")
      .map(e => e.domain)
      .filter(Boolean)
  )];

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatTime = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Dashboard Statistics
  const stats = {
    totalEmployees: employees.filter(e => e.email !== "admin@technova.com").length,
    totalAttendance: allAttendance.length,
    presentToday: allAttendance.filter(a => {
      const today = new Date().toDateString();
      return new Date(a.date).toDateString() === today && a.status === "Present";
    }).length,
    lateToday: allAttendance.filter(a => {
      const today = new Date().toDateString();
      return new Date(a.date).toDateString() === today && a.status === "Late";
    }).length,
    avgAttendance: allAttendance.length > 0
      ? ((allAttendance.filter(a => a.status === "Present" || a.status === "Late").length / allAttendance.length) * 100).toFixed(1)
      : 0,
    domainBreakdown: domains.reduce((acc, domain) => {
      acc[domain] = employees.filter(e => e.domain === domain && e.email !== "admin@technova.com").length;
      return acc;
    }, {})
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
          <p style={{ color: "#94a3b8" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo">TECHNOVA ADMIN</div>
          <div className="admin-badge">Administrator Panel</div>
        </div>

        <nav className="nav-menu">
          <div
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="nav-icon">🏠</span> Dashboard
          </div>
          <div
            className={`nav-item ${activeTab === "employees" ? "active" : ""}`}
            onClick={() => setActiveTab("employees")}
          >
            <span className="nav-icon">👥</span> Employees
          </div>
          <div
            className={`nav-item ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            <span className="nav-icon">📊</span> Attendance
          </div>
          <div
            className={`nav-item ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            <span className="nav-icon">📝</span> Tasks
          </div>
          <div
            className={`nav-item ${activeTab === "leaves" ? "active" : ""}`}
            onClick={() => setActiveTab("leaves")}
          >
            <span className="nav-icon">📅</span> Leaves
          </div>
          <div
            className={`nav-item ${activeTab === "salary" ? "active" : ""}`}
            onClick={() => navigate("/salary-configuration")}
          >
            <span className="nav-icon">⚙️</span> Salary Config
          </div>
          <div
            className={`nav-item ${activeTab === "payroll" ? "active" : ""}`}
            onClick={() => navigate("/payroll-processing")}
          >
            <span className="nav-icon">�</span> Payroll
          </div>
          <div
            className={`nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => navigate("/reports")}
          >
            <span className="nav-icon">📈</span> Reports
          </div>
          <div
            className={`nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => navigate("/notifications-management")}
          >
            <span className="nav-icon">📢</span> Notifications
          </div>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span> Logout
        </button>
      </aside>

      <main className="main-content">
        {/* Dashboard Overview */}
        {activeTab === "dashboard" && (
          <>
            <div className="content-header">
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">Overview of your organization</p>
            </div>

            {/* Main Statistics */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem"
            }}>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-value">{stats.totalEmployees}</div>
                <div className="stat-label">Total Employees</div>
                <div className="stat-subtext">Active workforce</div>
              </div>

              <div className="stat-card stat-success">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.presentToday}</div>
                <div className="stat-label">Present Today</div>
                <div className="stat-subtext">{stats.lateToday} late arrivals</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{stats.avgAttendance}%</div>
                <div className="stat-label">Attendance Rate</div>
                <div className="stat-subtext">Overall average</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-value">{domains.length}</div>
                <div className="stat-label">Domains</div>
                <div className="stat-subtext">Active domains</div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="card">
              <h2 className="card-title">Domain Distribution</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {Object.entries(stats.domainBreakdown).map(([domain, count]) => (
                  <div
                    key={domain}
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      {count}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                      {domain}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="card-title">Quick Actions</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div
                  className="action-btn"
                  onClick={() => setActiveTab("employees")}
                >
                  <div className="action-btn-icon">👥</div>
                  <div className="action-btn-text">Manage Employees</div>
                </div>
                <div
                  className="action-btn"
                  onClick={() => setActiveTab("attendance")}
                >
                  <div className="action-btn-icon">📊</div>
                  <div className="action-btn-text">View Attendance</div>
                </div>
                <div
                  className="action-btn"
                  onClick={() => setActiveTab("tasks")}
                >
                  <div className="action-btn-icon">📝</div>
                  <div className="action-btn-text">Assign Tasks</div>
                </div>
                <div
                  className="action-btn"
                  onClick={() => navigate("/payroll-processing")}
                >
                  <div className="action-btn-icon">�</div>
                  <div className="action-btn-text">Process Payroll</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h2 className="card-title">Recent Attendance Activity</h2>
              <div style={{ overflowX: "auto" }}>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendance.slice(0, 5).map((rec) => (
                      <tr key={rec._id}>
                        <td>{rec.employeeId?.fullName || "Unknown"}</td>
                        <td>{formatDate(rec.date)}</td>
                        <td>{formatTime(rec.checkIn)}</td>
                        <td>
                          <span className={`status-badge status-${rec.status.toLowerCase().replace(" ", "")}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Employee Management */}
        {activeTab === "employees" && (
          <>
            <div className="content-header">
              <h1 className="page-title">Employee Management</h1>
              <p className="page-subtitle">View and manage employee profiles</p>
            </div>

            <div className="controls">
              <input
                type="text"
                className="search-box"
                placeholder="🔍 Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="filter-select"
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
              >
                <option value="all">All Domains</option>
                {domains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="content-grid">
              <div className="card">
                <h2 className="card-title">
                  Employees ({filteredEmployees.length})
                </h2>
                <div className="employee-list">
                  {filteredEmployees.length === 0 ? (
                    <div className="empty-state">
                      <p style={{ color: "#94a3b8" }}>No employees found</p>
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp._id}
                        className={`employee-card ${selectedEmployee?._id === emp._id ? "active" : ""}`}
                        onClick={() => viewProfile(emp)}
                      >
                        <div className="employee-name">{emp.fullName}</div>
                        <div className="employee-email">{emp.email}</div>
                        <span className="employee-badge">{emp.domain}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card">
                {selectedEmployee ? (
                  <>
                    <div className="profile-header">
                      <h2 className="card-title">Employee Profile</h2>
                      {!isEditing && (
                        <button
                          className="btn btn-primary"
                          onClick={() => setIsEditing(true)}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="form-grid">
                        {["fullName", "email", "company", "phone", "domain"].map((field) => (
                          <div className="form-group" key={field}>
                            <label className="form-label">
                              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                            </label>
                            <div className="form-value">
                              {selectedEmployee[field] || "—"}
                            </div>
                          </div>
                        ))}
                        <div className="btn-group">
                          <button
                            className="btn btn-danger"
                            onClick={() => deleteEmployee(selectedEmployee._id)}
                          >
                            🗑️ Delete Employee
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="form-grid">
                        {["fullName", "email", "company", "phone", "domain"].map((field) => (
                          <div className="form-group" key={field}>
                            <label className="form-label">
                              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                            </label>
                            <input
                              className="form-input"
                              value={editForm[field] || ""}
                              onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                            />
                          </div>
                        ))}
                        <div className="btn-group">
                          <button className="btn btn-primary" onClick={saveChanges}>
                            💾 Save Changes
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setIsEditing(false);
                              setEditForm({
                                fullName: selectedEmployee.fullName,
                                email: selectedEmployee.email,
                                company: selectedEmployee.company,
                                phone: selectedEmployee.phone,
                                domain: selectedEmployee.domain,
                              });
                            }}
                          >
                            ✖ Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👥</div>
                    <h3>No Employee Selected</h3>
                    <p>Select an employee from the list to view their profile</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <>
            <div className="content-header">
              <h1 className="page-title">Attendance Overview</h1>
              <p className="page-subtitle">Monitor employee attendance records</p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{allAttendance.length}</div>
                <div className="stat-label">Total Records</div>
              </div>
              <div className="stat-card stat-success">
                <div className="stat-icon">✅</div>
                <div className="stat-value">
                  {allAttendance.filter(a => a.status === "Present").length}
                </div>
                <div className="stat-label">Present</div>
              </div>
              <div className="stat-card stat-warning">
                <div className="stat-icon">⏰</div>
                <div className="stat-value">
                  {allAttendance.filter(a => a.status === "Late").length}
                </div>
                <div className="stat-label">Late</div>
              </div>
              <div className="stat-card stat-danger">
                <div className="stat-icon">❌</div>
                <div className="stat-value">
                  {allAttendance.filter(a => a.status === "Absent").length}
                </div>
                <div className="stat-label">Absent</div>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">Recent Attendance (Last 20 Records)</h2>
              <div style={{ overflowX: "auto" }}>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", color: "#94a3b8" }}>
                          No attendance records found
                        </td>
                      </tr>
                    ) : (
                      allAttendance.slice(0, 20).map((rec) => (
                        <tr key={rec._id}>
                          <td>{rec.employeeId?.fullName || "Unknown"}</td>
                          <td>{formatDate(rec.date)}</td>
                          <td>{formatTime(rec.checkIn)}</td>
                          <td>{formatTime(rec.checkOut)}</td>
                          <td>{rec.workingHours?.toFixed(2) || "—"}</td>
                          <td>
                            <span className={`status-badge status-${rec.status.toLowerCase().replace(" ", "")}`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <>
            <div className="content-header">
              <h1 className="page-title">Task Management</h1>
              <p className="page-subtitle">Assign and track employee tasks</p>
            </div>
            <AdminTasks employees={employees} />
          </>
        )}

        {/* Leaves Tab */}
        {activeTab === "leaves" && (
          <>
            <div className="content-header">
              <h1 className="page-title">Leave Approvals</h1>
              <p className="page-subtitle">Review and manage employee leave requests</p>
            </div>

            <div className="card">
              <h2 className="card-title">Pending & Recent Leave Requests</h2>
              <div style={{ overflowX: "auto" }}>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLeaves.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", color: "#94a3b8" }}>
                          No leave requests found
                        </td>
                      </tr>
                    ) : (
                      allLeaves.map((leave) => (
                        <tr key={leave._id}>
                          <td>
                            <div style={{ fontWeight: "500" }}>{leave.employeeId?.fullName}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{leave.employeeId?.domain}</div>
                          </td>
                          <td>{leave.leaveType}</td>
                          <td>
                            <div>{formatDate(leave.startDate)}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>to {formatDate(leave.endDate)}</div>
                          </td>
                          <td title={leave.reason} style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {leave.reason}
                          </td>
                          <td>
                            <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              {leave.status !== "Approved" && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleLeaveStatus(leave._id, "Approved")}
                                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                                >
                                  Approve
                                </button>
                              )}
                              {leave.status !== "Rejected" && (
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleLeaveStatus(leave._id, "Rejected")}
                                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                                >
                                  Reject
                                </button>
                              )}
                              {(leave.status === "Approved" || leave.status === "Rejected") && (
                                <span style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>
                                  Decided
                                </span>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteLeave(leave._id)}
                                style={{ padding: "4px 8px", fontSize: "0.8rem", background: "transparent", border: "1px solid rgba(239, 68, 68, 0.4)" }}
                                title="Delete Record"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}


      </main>
    </div>
  );
};

export default AdminDashboard;