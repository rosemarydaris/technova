import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Trash2, Send, CheckCircle, AlertCircle, Bell, Users, Calendar, Filter } from "lucide-react";

const NotificationManagement = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        type: "info",
        recipientType: "all",
        domain: "",
        recipientId: "",
        scheduledFor: "",
        targetUrl: "",
        isImportant: false,
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchNotifications();
        fetchEmployees();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5001/api/notifications/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(response.data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5001/api/employees/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const filtered = response.data.filter(emp => emp.email !== "admin@technova.com" && !emp.isAdmin);
            setEmployees(filtered);
        } catch (error) {
            console.error("Error fetching employees", error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleEmployeeSelection = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
        setFormData((prev) => ({ ...prev, specificEmployees: selectedOptions }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("token");

            // 🔥 Sanitize data before sending
            const sanitizedData = {
                ...formData,
                recipientId: formData.recipientType === "individual" ? formData.recipientId : null,
                domain: formData.recipientType === "domain" ? formData.domain : null,
                scheduledFor: formData.scheduledFor || null, // Convert empty string to null
            };

            await axios.post("http://localhost:5001/api/notifications/create", sanitizedData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessage({ type: "success", text: "Notification sent successfully!" });
            fetchNotifications();
            setShowForm(false);
            setFormData({
                title: "",
                message: "",
                type: "info",
                recipientType: "all",
                domain: "",
                recipientId: "",
                scheduledFor: "",
                targetUrl: "",
                isImportant: false,
            });
            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Failed to send notification." });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this notification?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5001/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error deleting notification", error);
        }
    };

    return (
        <div className="page-container">
            <style>{`
                .page-container {
                    min-height: 100vh;
                    background-color: #0f172a;
                    padding: 2rem;
                    font-family: 'Inter', sans-serif;
                    color: #fff;
                }
                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .page-title {
                    font-size: 2rem;
                    font-weight: 700;
                    background: linear-gradient(90deg, #fff, #94a3b8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin: 0;
                }
                .btn-back {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    color: #94a3b8;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.2s;
                    cursor: pointer;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }
                .btn-back:hover {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                    border-color: #3b82f6;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }
                .card-container {
                    background: #1e293b;
                    border-radius: 16px;
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    margin-bottom: 2rem;
                }
                .card-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
                    background: rgba(30, 41, 59, 0.5);
                }
                .card-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #f8fafc;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .card-body {
                    padding: 1.5rem;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #cbd5e1;
                    font-weight: 500;
                    font-size: 0.95rem;
                }
                .form-control, .form-select {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: #334155; /* Lighter background for better visibility */
                    border: 1px solid #475569;
                    border-radius: 8px;
                    color: #f1f5f9 !important; /* Explicit bright text color */
                    font-size: 1rem;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }
                .form-control::placeholder {
                    color: #94a3b8;
                }
                .form-control:focus, .form-select:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
                    background: #1e293b; /* Slightly darker on focus */
                }
                .form-row {
                    display: flex;
                    gap: 1.5rem;
                }
                .form-col {
                    flex: 1;
                }
                .checkbox-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
                .checkbox-input {
                    width: 1.25rem;
                    height: 1.25rem;
                    cursor: pointer;
                }
                .text-danger {
                    color: #ef4444 !important;
                }
                
                /* Custom Table Styling */
                .custom-table-container {
                    overflow-x: auto;
                }
                .custom-table {
                    width: 100%;
                    border-collapse: collapse;
                    color: #e2e8f0;
                }
                .custom-table th {
                    text-align: left;
                    padding: 1rem 1.5rem;
                    background: rgba(51, 65, 85, 0.5);
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .custom-table td {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
                    vertical-align: top;
                }
                .custom-table tr:hover {
                    background: rgba(30, 41, 59, 0.5);
                }
                .notification-title {
                    font-weight: 600;
                    color: #f1f5f9;
                    font-size: 1rem;
                    margin-bottom: 0.25rem;
                }
                .notification-message {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    max-width: 400px;
                }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .badge-primary { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
                .badge-success { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
                .badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
                .badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
                .badge-info { background: rgba(6, 182, 212, 0.2); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3); }
                .badge-secondary { background: rgba(100, 116, 139, 0.2); color: #cbd5e1; border: 1px solid rgba(100, 116, 139, 0.3); }
                
                .btn-icon {
                    background: transparent;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: #ef4444;
                }
                .alert {
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .alert-success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #34d399; }
                .alert-error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; }
                
                .date-text { color: #94a3b8; font-size: 0.9rem; display: flex; align-items: center; gap: 0.4rem; }
            `}</style>

            <div className="header-section">
                <div>
                    <button className="btn-back" onClick={() => navigate('/admin-dashboard')}>
                        &larr; Back to Dashboard
                    </button>
                    <h1 className="page-title">Notification Management</h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Create and manage announcements for your organization</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel Creation" : <> <Send size={18} /> Create Notification </>}
                </button>
            </div>

            {message && (
                <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
                    {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {showForm && (
                <div className="card-container fade-in">
                    <div className="card-header">
                        <h5 className="card-title"><Send size={20} className="text-primary" /> Compose Notification</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="title"
                                    placeholder="e.g. Updating Office Policy"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Message Content</label>
                                <textarea
                                    className="form-control"
                                    name="message"
                                    rows="4"
                                    placeholder="Enter the notification content..."
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-col">
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                                            <option value="info">Info</option>
                                            <option value="Salary">Salary</option>
                                            <option value="Leave">Leave</option>
                                            <option value="Important Work">Important Work</option>
                                            <option value="General">General</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-col">
                                    <div className="form-group">
                                        <label className="form-label">Recipient</label>
                                        <select className="form-select" name="recipientType" value={formData.recipientType} onChange={handleChange}>
                                            <option value="all">All Employees</option>
                                            <option value="domain">By Domain</option>
                                            <option value="individual">Individual</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Fields based on Recipient Type */}
                            {formData.recipientType === "domain" && (
                                <div className="form-group">
                                    <label className="form-label">Select Domain</label>
                                    <select className="form-select" name="domain" value={formData.domain} onChange={handleChange} required>
                                        <option value="">-- Select Domain --</option>
                                        {[...new Set(employees.map(e => e.domain))].filter(Boolean).map(domain => (
                                            <option key={domain} value={domain}>{domain}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.recipientType === "individual" && (
                                <div className="form-group">
                                    <label className="form-label">Select Employee</label>
                                    <select className="form-select" name="recipientId" value={formData.recipientId} onChange={handleChange} required>
                                        <option value="">-- Select Employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.fullName} ({emp.domain})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-col">
                                    <div className="form-group">
                                        <label className="form-label">Schedule (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            name="scheduledFor"
                                            value={formData.scheduledFor}
                                            onChange={handleChange}
                                        />
                                        <small style={{ color: '#64748b' }}>Leave blank to send immediately</small>
                                    </div>
                                </div>
                                <div className="form-col">
                                    <div className="form-group">
                                        <label className="form-label">Target URL (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="targetUrl"
                                            placeholder="/tasks or /payroll"
                                            value={formData.targetUrl}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        className="checkbox-input"
                                        name="isImportant"
                                        checked={formData.isImportant}
                                        onChange={handleChange}
                                    />
                                    <span className={formData.isImportant ? "text-danger" : ""}>Mark as Important / Urgent</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? "Sending..." : <><Send size={18} /> Send Notification</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card-container">
                <div className="card-header">
                    <h5 className="card-title"><Bell size={20} /> Sent History</h5>
                </div>
                {notifications.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <p>No notifications have been sent yet.</p>
                    </div>
                ) : (
                    <div className="custom-table-container">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '35%' }}>Notification Details</th>
                                    <th>Type</th>
                                    <th>Audience</th>
                                    <th>Sent Date</th>
                                    <th>Status</th>
                                    <th style={{ width: '80px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((notif) => (
                                    <tr key={notif._id}>
                                        <td>
                                            <div className="notification-title">
                                                {notif.isImportant && <AlertCircle size={14} className="text-danger" style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
                                                {notif.title}
                                            </div>
                                            <div className="notification-message">
                                                {notif.message.length > 100 ? notif.message.substring(0, 100) + "..." : notif.message}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${getTypeColor(notif.type)}`}>{notif.type}</span>
                                        </td>
                                        <td>
                                            {notif.recipientType === "all" && (
                                                <span className="badge badge-secondary"><Users size={12} style={{ marginRight: '4px' }} /> All Staff</span>
                                            )}
                                            {notif.recipientType === "domain" && (
                                                <span className="badge badge-info"><Users size={12} style={{ marginRight: '4px' }} /> {notif.domain}</span>
                                            )}
                                            {notif.recipientType === "individual" && (
                                                <span className="badge badge-primary"><Users size={12} style={{ marginRight: '4px' }} /> {notif.recipientId?.fullName || "Employee"}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="date-text">
                                                <Calendar size={14} />
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.9rem' }}>
                                                <strong style={{ color: '#fff' }}>{notif.readBy?.length || 0}</strong> <span style={{ color: '#64748b' }}>Read</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDelete(notif._id)}
                                                title="Delete Notification"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const getTypeColor = (type) => {
    switch (type) {
        case "Salary": return "success";
        case "Leave": return "warning";
        case "Important Work": return "danger";
        case "info": return "info";
        case "general": return "secondary";
        default: return "primary";
    }
};

export default NotificationManagement;
