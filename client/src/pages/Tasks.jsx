import React, { useEffect, useState } from "react";
import axios from "axios";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");

  // State for updating task
  const [editingParams, setEditingParams] = useState(null); // { id: taskId, status, comment: "", file: null }

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5001/api/tasks/my-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingParams) return;

    const formData = new FormData();
    if (editingParams.status) formData.append("status", editingParams.status);
    if (editingParams.comment) formData.append("comment", editingParams.comment);
    if (editingParams.file) formData.append("file", editingParams.file);

    try {
      await axios.put(
        `http://localhost:5001/api/tasks/${editingParams.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Task updated successfully!");
      setEditingParams(null);

      // Clear file input if exists
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = "");

      fetchTasks();
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "#10b981"; // green-500
      case "In Progress": return "#f59e0b"; // amber-500
      case "Pending": return "#ef4444"; // red-500
      default: return "#64748b"; // slate-500
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "#ef4444";
      case "Medium": return "#f59e0b";
      case "Low": return "#10b981";
      default: return "#64748b";
    }
  };

  const filteredTasks = tasks.filter(task =>
    filter === "All" ? true : task.status === filter
  );

  return (
    <div className="content-grid">
      {/* Header & Stats */}
      <div className="card">
        <h2 className="card-title">My Tasks</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div className="stats-card">
            <div className="stats-value">{tasks.length}</div>
            <div className="stats-label">Total Tasks</div>
          </div>
          <div className="stats-card" style={{ borderColor: '#ef4444' }}>
            <div className="stats-value">{tasks.filter(t => t.status === "Pending").length}</div>
            <div className="stats-label" style={{ color: '#ef4444' }}>Pending</div>
          </div>
          <div className="stats-card" style={{ borderColor: '#f59e0b' }}>
            <div className="stats-value">{tasks.filter(t => t.status === "In Progress").length}</div>
            <div className="stats-label" style={{ color: '#f59e0b' }}>In Progress</div>
          </div>
          <div className="stats-card" style={{ borderColor: '#10b981' }}>
            <div className="stats-value">{tasks.filter(t => t.status === "Completed").length}</div>
            <div className="stats-label" style={{ color: '#10b981' }}>Completed</div>
          </div>
        </div>
      </div>

      {/* Task Filters & List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: "#f1f5f9", margin: 0 }}>Task List</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {["All", "Pending", "In Progress", "Completed"].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p>Loading tasks...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredTasks.length === 0 ? <p style={{ color: "#94a3b8" }}>No tasks found.</p> :
              filteredTasks.map(task => (
                <div key={task._id} style={{
                  background: "rgba(30, 41, 59, 0.5)",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${getStatusColor(task.status)}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <h4 style={{ color: "white", margin: 0, fontSize: "1.1rem" }}>{task.title}</h4>
                    <span style={{
                      background: getPriorityColor(task.priority),
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      color: "white"
                    }}>
                      {task.priority} Priority
                    </span>
                  </div>

                  <p style={{ color: "#cbd5e1", marginBottom: "1rem" }}>{task.description}</p>

                  {/* Metadata */}
                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
                    <span>📅 Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}</span>
                    <span>👤 Assigned By: {task.assignedBy}</span>
                  </div>

                  {/* Attachment Section */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div style={{ marginBottom: "1rem", padding: "0.5rem", background: "rgba(15,23,42,0.3)", borderRadius: "4px" }}>
                      <small style={{ color: "#94a3b8", display: "block", marginBottom: "0.25rem" }}>📎 Attachments:</small>
                      {task.attachments.map((file, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: "0.85rem" }}>
                          <a href={`http://localhost:5001/${file.filePath}`} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}>
                            {file.fileName}
                          </a>
                          <span style={{ color: "#64748b" }}>by {file.uploadedBy}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions / Update Form */}
                  {editingParams && editingParams.id === task._id ? (
                    <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "8px", marginTop: "1rem" }}>
                      <h5 style={{ color: "white", marginTop: 0 }}>Update Status</h5>

                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                          className="form-input"
                          value={editingParams.status}
                          onChange={(e) => setEditingParams({ ...editingParams, status: e.target.value })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Comment</label>
                        <textarea
                          className="form-input"
                          rows="2"
                          placeholder="Add a comment..."
                          value={editingParams.comment}
                          onChange={(e) => setEditingParams({ ...editingParams, comment: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Upload Work (Optional)</label>
                        <input
                          type="file"
                          className="form-input"
                          onChange={(e) => setEditingParams({ ...editingParams, file: e.target.files[0] })}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-primary" onClick={handleUpdateTask}>Submit Update</button>
                        <button className="btn btn-secondary" onClick={() => setEditingParams(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: "0.5rem" }}
                      onClick={() => setEditingParams({
                        id: task._id,
                        status: task.status,
                        comment: "",
                        file: null
                      })}
                    >
                      Update Status / Upload Work
                    </button>
                  )}

                  {/* Comments Display */}
                  {task.comments && task.comments.length > 0 && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(148,163,184,0.1)" }}>
                      <div style={{ fontSize: "0.9rem", color: "#f1f5f9", marginBottom: "0.5rem" }}>Recent Comments:</div>
                      {task.comments.slice(-3).map((c, idx) => (
                        <div key={idx} style={{ fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>
                          <span style={{ color: "#60a5fa" }}>{c.addedBy}:</span> {c.text}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))
            }
          </div>
        )}
      </div>

      <style jsx>{`
        .stats-card {
          background: rgba(30, 41, 59, 0.5);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          text-align: center;
          border-bottom-width: 4px;
        }
        .stats-value { font-size: 2rem; font-weight: bold; color: white; }
        .stats-label { color: #94a3b8; margin-top: 0.5rem; font-size: 0.9rem; }
      `}</style>
    </div>
  );
};

export default Tasks;