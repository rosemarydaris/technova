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
      // alert("Failed to fetch tasks"); // Suppressed for smoother UX
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

      // Reset file input
      // Reset file input - REMOVED


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
    <div className="content-grid">
      {/* TABS HEADER */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "1.5rem",
        background: "rgba(30, 41, 59, 0.5)",
        padding: "0.5rem",
        borderRadius: "8px"
      }}>
        {[
          { id: "assign", label: "➕ Assign & Manage" },
          { id: "all", label: "📋 All Tasks" },
          { id: "reports", label: "📊 Reports" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.5rem 1.5rem",
              background: activeTab === tab.id ? "#3b82f6" : "transparent",
              color: activeTab === tab.id ? "white" : "#94a3b8",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              flex: 1
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: ASSIGN & MANAGE ================= */}
      {activeTab === "assign" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Employee List */}
          <div className="card">
            <h2 className="card-title">Select Employee</h2>
            <input
              type="text"
              className="search-box"
              placeholder="🔍 Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />
            <div className="employee-list">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp._id}
                  className={`employee-card ${selectedEmployee?._id === emp._id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    fetchTasks(emp.email);
                    setEditingTask(null);
                  }}
                >
                  <div className="employee-name">{emp.fullName}</div>
                  <div className="employee-email">{emp.domain}</div>
                  <span className="employee-badge">{emp.domain}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Form & List */}
          <div className="card">
            {selectedEmployee ? (
              <>
                <h2 className="card-title">Tasks for {selectedEmployee.fullName}</h2>

                {/* Assignment Form */}
                <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                  <h3 style={{ color: "#f1f5f9", marginBottom: "1rem" }}>Assign New Task</h3>
                  <div className="form-group">
                    <label className="form-label">Task Title</label>
                    <input className="form-input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows="3" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select className="form-input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                        <option>Low</option><option>Medium</option><option>High</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input type="date" className="form-input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                    </div>

                  </div>
                  <button className="btn btn-primary" onClick={assignTask} style={{ width: "100%", marginTop: "1rem" }}>Assign Task</button>
                </div>

                {/* Task List */}
                <h3 style={{ color: "#f1f5f9", marginBottom: "1rem" }}>Assigned Tasks ({tasks.length})</h3>
                {tasks.length === 0 ? <p style={{ color: "#94a3b8" }}>No tasks found.</p> : (
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
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state"><h3>No Employee Selected</h3><p>Select an employee to manage tasks</p></div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ALL TASKS ================= */}
      {activeTab === "all" && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title">All Tasks Overview</h2>
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={filterStats}
              onChange={(e) => setFilterStats(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {loading ? <p>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredAllTasks.map(task => (
                <div key={task._id} style={{ background: "rgba(30, 41, 59, 0.5)", padding: "1rem", borderRadius: "8px", borderLeft: `4px solid ${getStatusColor(task.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ color: "white", margin: 0 }}>{task.title}</h4>
                    <span style={{ color: "#94a3b8", fontSize: '0.8rem' }}>{task.assignedTo}</span>
                  </div>
                  <p style={{ color: "#cbd5e1", fontSize: "0.9rem", margin: "0.5rem 0" }}>{task.description}</p>

                  {/* Attachments */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <small style={{ color: "#94a3b8" }}>📎 Attachments: </small>
                      {task.attachments.map((file, i) => (
                        <a key={i} href={`http://localhost:5001/${file.filePath}`} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", marginRight: "10px", fontSize: "0.85rem" }}>
                          {file.fileName}
                        </a>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge" style={{ background: getStatusColor(task.status) }}>{task.status}</span>
                    <span className="badge" style={{ background: "#475569" }}>{task.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: REPORTS ================= */}
      {activeTab === "reports" && (
        <div className="card">
          <h2 className="card-title">Task Reports & Analytics</h2>
          {loading || !reports ? <p>Loading reports...</p> : (
            <>
              {/* Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {Object.entries(reports.overview).map(([status, count]) => (
                  <div key={status} style={{ background: "rgba(30, 41, 59, 0.8)", padding: "1.5rem", borderRadius: "8px", textAlign: "center", border: `1px solid ${getStatusColor(status)}` }}>
                    <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>{count}</div>
                    <div style={{ color: getStatusColor(status) }}>{status}</div>
                  </div>
                ))}
              </div>

              {/* Employee Performance Table */}
              <h3 style={{ color: "#f1f5f9", marginBottom: "1rem" }}>Employee Performance</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#cbd5e1" }}>
                <thead>
                  <tr style={{ background: "rgba(15, 23, 42, 0.8)", textAlign: "left" }}>
                    <th style={{ padding: "1rem" }}>Employee</th>
                    <th style={{ padding: "1rem" }}>Total Tasks</th>
                    <th style={{ padding: "1rem" }}>Completed</th>
                    <th style={{ padding: "1rem" }}>Pending</th>
                    <th style={{ padding: "1rem" }}>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.employees.map((emp, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                      <td style={{ padding: "1rem" }}>{emp.email}</td>
                      <td style={{ padding: "1rem" }}>{emp.total}</td>
                      <td style={{ padding: "1rem", color: "#10b981" }}>{emp.completed}</td>
                      <td style={{ padding: "1rem", color: "#f59e0b" }}>{emp.pending}</td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ width: "100px", height: "8px", background: "#334155", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${emp.completionRate}%`, height: "100%", background: "#3b82f6" }}></div>
                        </div>
                        <span style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>{emp.completionRate.toFixed(1)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Subcomponent for cleaner Task List
const TaskCard = ({ task, onEdit, onDelete, editing, onSave, onCancelEdit }) => {
  const [formData, setFormData] = useState({ title: task.title, description: task.description });

  if (editing) {
    return (
      <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "1rem", borderRadius: "8px" }}>
        <input className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ marginBottom: "0.5rem" }} />
        <textarea className="form-input" rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ marginBottom: "0.5rem" }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => onSave(formData)}>Save</button>
          <button className="btn btn-secondary" onClick={onCancelEdit}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h4 style={{ color: "white", margin: 0 }}>{task.title}</h4>
        <div>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✏️</button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '0.5rem' }}>🗑️</button>
        </div>
      </div>
      <p style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>{task.description}</p>

      {/* Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <small style={{ color: "#94a3b8" }}>📎 Attachments: </small>
          {task.attachments.map((file, i) => (
            <a key={i} href={`http://localhost:5001/${file.filePath}`} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", marginRight: "10px", fontSize: "0.85rem" }}>
              {file.fileName}
            </a>
          ))}
        </div>
      )}

      <div style={{ marginTop: "0.5rem", display: 'flex', gap: '0.5rem' }}>
        <span style={{ fontSize: "0.8rem", padding: "2px 8px", borderRadius: "4px", background: "#334155", color: "white" }}>{task.status}</span>
        <span style={{ fontSize: "0.8rem", padding: "2px 8px", borderRadius: "4px", background: "#475569", color: "white" }}>{task.priority}</span>
      </div>
    </div>
  );
};

export default AdminTasks;