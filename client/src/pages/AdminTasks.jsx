import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminTasks = ({ employees }) => {
  const [activeTab, setActiveTab] = useState("assign"); // assign, all, reports
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState(null);

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: ""
  });

  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStats, setFilterStats] = useState("All");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (activeTab === "all") fetchAllTasks();
    if (activeTab === "reports") fetchReports();
  }, [activeTab]);

  // ================= API CALLS =================

  const fetchTasks = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5001/api/tasks/admin/${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5001/api/tasks/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllTasks(res.data);
    } catch (err) {
      console.error("Error fetching all tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5001/api/tasks/reports",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async () => {
    if (!selectedEmployee) return alert("Please select an employee");
    if (!taskForm.title.trim() || !taskForm.description.trim()) {
      return alert("Title and description are required");
    }

    const formData = new FormData();
    formData.append("title", taskForm.title);
    formData.append("description", taskForm.description);
    formData.append("priority", taskForm.priority);
    formData.append("dueDate", taskForm.dueDate || "");
    formData.append("assignedTo", selectedEmployee.email);
    formData.append("domain", selectedEmployee.domain);

    try {
      await axios.post(
        "http://localhost:5001/api/tasks",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Task assigned successfully!");
      setTaskForm({
        title: "", description: "", priority: "Medium", dueDate: ""
      });

      fetchTasks(selectedEmployee.email);
    } catch (err) {
      console.error("Error assigning task:", err);
      alert("Failed to assign task");
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await axios.put(
        `http://localhost:5001/api/tasks/admin/${taskId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Task updated successfully!");
      if (activeTab === "assign") fetchTasks(selectedEmployee.email);
      if (activeTab === "all") fetchAllTasks();
      setEditingTask(null);
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(
        `http://localhost:5001/api/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Task deleted successfully!");
      if (activeTab === "assign") fetchTasks(selectedEmployee.email);
      if (activeTab === "all") fetchAllTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task");
    }
  };

  // ================= HELPERS =================

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "#10b981";
      case "In Progress": return "#f59e0b";
      case "Pending": return "#ef4444";
      default: return "#64748b";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "#ef4444";
      case "Medium": return "#f59e0b";
      case "Low": return "#3b82f6";
      default: return "#64748b";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "High": return "🔴";
      case "Medium": return "🟡";
      case "Low": return "🟢";
      default: return "⚪";
    }
  };

  // Ensure employees is an array to prevent crashes
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const filteredEmployees = safeEmployees
    .filter(emp => emp.email !== "admin@technova.com" && !emp.isAdmin)
    .filter(emp =>
      (emp.fullName && emp.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const filteredAllTasks = allTasks.filter(task =>
    filterStats === "All" ? true : task.status === filterStats
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* TABS HEADER - Enhanced */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
        padding: "0.75rem",
        borderRadius: "12px",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
      }}>
        {[
          { id: "assign", label: "Assign & Manage", icon: "➕" },
          { id: "all", label: "All Tasks", icon: "📋" },
          { id: "reports", label: "Analytics", icon: "📊" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === tab.id
                ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                : "transparent",
              color: activeTab === tab.id ? "white" : "#94a3b8",
              border: activeTab === tab.id ? "1px solid rgba(59, 130, 246, 0.5)" : "1px solid transparent",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              flex: 1,
              transition: "all 0.3s ease",
              fontSize: "0.95rem",
              boxShadow: activeTab === tab.id ? "0 4px 12px rgba(59, 130, 246, 0.4)" : "none"
            }}
          >
            <span style={{ marginRight: "0.5rem" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: ASSIGN & MANAGE - Enhanced ================= */}
      {activeTab === "assign" && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem' }}>
          {/* Employee List - Enhanced */}
          <div className="card" style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
              <h2 className="card-title" style={{ margin: 0 }}>Select Employee</h2>
            </div>
            <input
              type="text"
              className="search-box"
              placeholder="🔍 Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                marginBottom: "1rem",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "8px",
                padding: "0.75rem 1rem"
              }}
            />
            <div className="employee-list" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredEmployees.map((emp) => (
                <div
                  key={emp._id}
                  className={`employee-card ${selectedEmployee?._id === emp._id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    fetchTasks(emp.email);
                    setEditingTask(null);
                  }}
                  style={{
                    background: selectedEmployee?._id === emp._id
                      ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)"
                      : "rgba(15, 23, 42, 0.4)",
                    border: selectedEmployee?._id === emp._id
                      ? "1px solid rgba(59, 130, 246, 0.5)"
                      : "1px solid rgba(148, 163, 184, 0.1)",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: selectedEmployee?._id === emp._id
                      ? "0 4px 12px rgba(59, 130, 246, 0.3)"
                      : "none"
                  }}
                >
                  <div className="employee-name" style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: selectedEmployee?._id === emp._id ? "#60a5fa" : "#f1f5f9"
                  }}>
                    {emp.fullName}
                  </div>
                  <div className="employee-email" style={{
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    marginTop: "0.25rem"
                  }}>
                    {emp.email}
                  </div>
                  <span className="employee-badge" style={{
                    display: "inline-block",
                    marginTop: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    background: "rgba(59, 130, 246, 0.2)",
                    color: "#60a5fa",
                    border: "1px solid rgba(59, 130, 246, 0.3)"
                  }}>
                    {emp.domain}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Form & List - Enhanced */}
          <div className="card" style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)"
          }}>
            {selectedEmployee ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📝</span>
                  <h2 className="card-title" style={{ margin: 0 }}>Tasks for {selectedEmployee.fullName}</h2>
                </div>

                {/* Assignment Form - Enhanced */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginBottom: "2rem",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)"
                }}>
                  <h3 style={{
                    color: "#f1f5f9",
                    marginBottom: "1.25rem",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span>✨</span> Assign New Task
                  </h3>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: "600", color: "#cbd5e1" }}>Task Title</label>
                    <input
                      className="form-input"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      placeholder="Enter task title..."
                      style={{
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "8px"
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: "600", color: "#cbd5e1" }}>Description</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      placeholder="Describe the task in detail..."
                      style={{
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "8px"
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: "600", color: "#cbd5e1" }}>Priority</label>
                      <select
                        className="form-input"
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        style={{
                          background: "rgba(15, 23, 42, 0.6)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: "8px"
                        }}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: "600", color: "#cbd5e1" }}>Due Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        style={{
                          background: "rgba(15, 23, 42, 0.6)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: "8px"
                        }}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={assignTask}
                    style={{
                      width: "100%",
                      marginTop: "1rem",
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      padding: "0.875rem",
                      fontSize: "1rem",
                      fontWeight: "600",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ marginRight: "0.5rem" }}>🚀</span>
                    Assign Task
                  </button>
                </div>

                {/* Task List - Enhanced */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h3 style={{ color: "#f1f5f9", margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
                    Assigned Tasks
                  </h3>
                  <span style={{
                    background: "rgba(59, 130, 246, 0.2)",
                    color: "#60a5fa",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    fontWeight: "600"
                  }}>
                    {tasks.length}
                  </span>
                </div>
                {tasks.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#94a3b8",
                    background: "rgba(15, 23, 42, 0.4)",
                    borderRadius: "8px",
                    border: "1px dashed rgba(148, 163, 184, 0.2)"
                  }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                    <p style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>No tasks assigned yet</p>
                    <p style={{ fontSize: "0.9rem" }}>Create a new task to get started</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {tasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onEdit={() => setEditingTask(task._id)}
                        onDelete={() => deleteTask(task._id)}
                        editing={editingTask === task._id}
                        onSave={(updates) => updateTask(task._id, updates)}
                        onCancelEdit={() => setEditingTask(null)}
                        getPriorityColor={getPriorityColor}
                        getPriorityIcon={getPriorityIcon}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "rgba(15, 23, 42, 0.4)",
                borderRadius: "12px",
                border: "1px dashed rgba(148, 163, 184, 0.2)"
              }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👈</div>
                <h3 style={{ color: "#f1f5f9", fontSize: "1.25rem", marginBottom: "0.5rem" }}>No Employee Selected</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Select an employee from the list to manage their tasks</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ALL TASKS - Enhanced ================= */}
      {activeTab === "all" && (
        <div className="card" style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <h2 className="card-title" style={{ margin: 0 }}>All Tasks Overview</h2>
            </div>
            <select
              className="form-input"
              style={{
                width: 'auto',
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "8px",
                padding: "0.5rem 1rem"
              }}
              value={filterStats}
              onChange={(e) => setFilterStats(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
              <p>Loading tasks...</p>
            </div>
          ) : filteredAllTasks.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "3rem",
              color: "#94a3b8",
              background: "rgba(15, 23, 42, 0.4)",
              borderRadius: "8px",
              border: "1px dashed rgba(148, 163, 184, 0.2)"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
              <p style={{ fontSize: "1.1rem", fontWeight: "600" }}>No tasks found</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredAllTasks.map(task => (
                <div
                  key={task._id}
                  style={{
                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
                    padding: "1.25rem",
                    borderRadius: "12px",
                    borderLeft: `4px solid ${getStatusColor(task.status)}`,
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: "white", margin: 0, fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                        {task.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: "#94a3b8", fontSize: '0.85rem' }}>👤</span>
                        <span style={{ color: "#94a3b8", fontSize: '0.85rem' }}>
                          {typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo?.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span style={{
                        fontSize: "0.8rem",
                        padding: "0.375rem 0.75rem",
                        borderRadius: "6px",
                        background: getStatusColor(task.status),
                        color: "white",
                        fontWeight: "600",
                        whiteSpace: "nowrap"
                      }}>
                        {task.status}
                      </span>
                      <span style={{
                        fontSize: "0.8rem",
                        padding: "0.375rem 0.75rem",
                        borderRadius: "6px",
                        background: getPriorityColor(task.priority),
                        color: "white",
                        fontWeight: "600",
                        whiteSpace: "nowrap"
                      }}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: "#cbd5e1", fontSize: "0.95rem", margin: "0.75rem 0", lineHeight: "1.6" }}>
                    {task.description}
                  </p>

                  {/* Attachments */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div style={{
                      marginTop: "0.75rem",
                      padding: "0.75rem",
                      background: "rgba(15, 23, 42, 0.6)",
                      borderRadius: "6px",
                      border: "1px solid rgba(148, 163, 184, 0.1)"
                    }}>
                      <small style={{ color: "#94a3b8", fontWeight: "600" }}>📎 Attachments: </small>
                      <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {task.attachments.map((file, i) => (
                          <a
                            key={i}
                            href={`http://localhost:5001/${file.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#60a5fa",
                              fontSize: "0.85rem",
                              padding: "0.25rem 0.75rem",
                              background: "rgba(59, 130, 246, 0.1)",
                              borderRadius: "6px",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              textDecoration: "none",
                              transition: "all 0.2s ease"
                            }}
                          >
                            📄 {file.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: REPORTS - Enhanced ================= */}
      {activeTab === "reports" && (
        <div className="card" style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <h2 className="card-title" style={{ margin: 0 }}>Task Analytics & Reports</h2>
          </div>
          {loading || !reports ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
              <p>Loading reports...</p>
            </div>
          ) : (
            <>
              {/* Overview Cards - Enhanced */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {Object.entries(reports.overview).map(([status, count]) => (
                  <div
                    key={status}
                    style={{
                      background: `linear-gradient(135deg, ${getStatusColor(status)}15 0%, ${getStatusColor(status)}05 100%)`,
                      padding: "2rem 1.5rem",
                      borderRadius: "12px",
                      textAlign: "center",
                      border: `2px solid ${getStatusColor(status)}40`,
                      boxShadow: `0 4px 12px ${getStatusColor(status)}20`,
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: getStatusColor(status), marginBottom: "0.5rem" }}>
                      {count}
                    </div>
                    <div style={{ color: "#cbd5e1", fontWeight: "600", fontSize: "0.95rem" }}>
                      {status}
                    </div>
                  </div>
                ))}
              </div>

              {/* Employee Performance Table - Enhanced */}
              <h3 style={{
                color: "#f1f5f9",
                marginBottom: "1.5rem",
                fontSize: "1.2rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span>👥</span> Employee Performance
              </h3>
              <div style={{
                overflowX: "auto",
                background: "rgba(15, 23, 42, 0.4)",
                borderRadius: "12px",
                border: "1px solid rgba(148, 163, 184, 0.1)"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#cbd5e1" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                      <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#f1f5f9" }}>Employee</th>
                      <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#f1f5f9" }}>Total Tasks</th>
                      <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#f1f5f9" }}>Completed</th>
                      <th style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#f1f5f9" }}>Pending</th>
                      <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#f1f5f9" }}>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.employees.map((emp, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <td style={{ padding: "1rem", color: "#f1f5f9", fontWeight: "500" }}>{emp.email}</td>
                        <td style={{ padding: "1rem", textAlign: "center", fontWeight: "600" }}>{emp.total}</td>
                        <td style={{ padding: "1rem", textAlign: "center", color: "#10b981", fontWeight: "600" }}>{emp.completed}</td>
                        <td style={{ padding: "1rem", textAlign: "center", color: "#f59e0b", fontWeight: "600" }}>{emp.pending}</td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                              flex: 1,
                              height: "10px",
                              background: "rgba(51, 65, 85, 0.6)",
                              borderRadius: "6px",
                              overflow: "hidden",
                              border: "1px solid rgba(148, 163, 184, 0.2)"
                            }}>
                              <div style={{
                                width: `${emp.completionRate}%`,
                                height: "100%",
                                background: emp.completionRate >= 70
                                  ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                                  : emp.completionRate >= 40
                                    ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                                    : "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                                transition: "width 0.3s ease"
                              }}></div>
                            </div>
                            <span style={{
                              fontSize: "0.9rem",
                              fontWeight: "600",
                              minWidth: "50px",
                              color: emp.completionRate >= 70 ? "#10b981" : emp.completionRate >= 40 ? "#f59e0b" : "#ef4444"
                            }}>
                              {emp.completionRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Task Card Component
const TaskCard = ({ task, onEdit, onDelete, editing, onSave, onCancelEdit, getPriorityColor, getPriorityIcon, getStatusColor }) => {
  const [formData, setFormData] = useState({ title: task.title, description: task.description });

  if (editing) {
    return (
      <div style={{
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
        padding: "1.25rem",
        borderRadius: "12px",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
      }}>
        <input
          className="form-input"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          style={{
            marginBottom: "0.75rem",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "8px"
          }}
          placeholder="Task title..."
        />
        <textarea
          className="form-input"
          rows="3"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          style={{
            marginBottom: "0.75rem",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "8px"
          }}
          placeholder="Task description..."
        />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => onSave(formData)}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              padding: "0.625rem 1.25rem",
              borderRadius: "8px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer"
            }}
          >
            💾 Save
          </button>
          <button
            className="btn btn-secondary"
            onClick={onCancelEdit}
            style={{
              background: "rgba(71, 85, 105, 0.6)",
              padding: "0.625rem 1.25rem",
              borderRadius: "8px",
              fontWeight: "600",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              cursor: "pointer"
            }}
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
      padding: "1.25rem",
      borderRadius: "12px",
      border: "1px solid rgba(148, 163, 184, 0.1)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      transition: "all 0.2s ease",
      borderLeft: `4px solid ${getStatusColor(task.status)}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
        <h4 style={{ color: "white", margin: 0, fontSize: "1.05rem", fontWeight: "600", flex: 1 }}>
          {task.title}
        </h4>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={onEdit}
            style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: "0.375rem 0.625rem",
              borderRadius: "6px",
              transition: "all 0.2s ease"
            }}
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: "0.375rem 0.625rem",
              borderRadius: "6px",
              transition: "all 0.2s ease"
            }}
          >
            🗑️
          </button>
        </div>
      </div>
      <p style={{ color: "#cbd5e1", fontSize: "0.95rem", marginBottom: "0.75rem", lineHeight: "1.6" }}>
        {task.description}
      </p>

      {/* Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <div style={{
          marginTop: "0.75rem",
          marginBottom: "0.75rem",
          padding: "0.75rem",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "6px",
          border: "1px solid rgba(148, 163, 184, 0.1)"
        }}>
          <small style={{ color: "#94a3b8", fontWeight: "600" }}>📎 Attachments: </small>
          <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {task.attachments.map((file, i) => (
              <a
                key={i}
                href={`http://localhost:5001/${file.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#60a5fa",
                  fontSize: "0.85rem",
                  padding: "0.25rem 0.75rem",
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: "6px",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  textDecoration: "none",
                  transition: "all 0.2s ease"
                }}
              >
                📄 {file.fileName}
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: "0.8rem",
          padding: "0.375rem 0.75rem",
          borderRadius: "6px",
          background: getStatusColor(task.status),
          color: "white",
          fontWeight: "600"
        }}>
          {task.status}
        </span>
        <span style={{
          fontSize: "0.8rem",
          padding: "0.375rem 0.75rem",
          borderRadius: "6px",
          background: getPriorityColor(task.priority),
          color: "white",
          fontWeight: "600"
        }}>
          {getPriorityIcon(task.priority)} {task.priority}
        </span>
        {task.dueDate && (
          <span style={{
            fontSize: "0.8rem",
            padding: "0.375rem 0.75rem",
            borderRadius: "6px",
            background: "rgba(100, 116, 139, 0.3)",
            color: "#cbd5e1",
            border: "1px solid rgba(148, 163, 184, 0.2)"
          }}>
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminTasks;