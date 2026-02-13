import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Clock, AlertTriangle, Briefcase, DollarSign, Calendar, Filter, ChevronRight, CheckCircle } from "lucide-react";

const EmployeeNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5001/api/notifications/my-notifications", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(response.data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:5001/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    const getFilteredNotifications = () => {
        if (filter === "All") return notifications;
        return notifications.filter(n => {
            if (filter === "General") {
                return n.type === "General" || n.type === "general" || !["Salary", "Leave", "Important Work"].includes(n.type);
            }
            return n.type === filter;
        });
    };

    const isRead = (notification) => {
        const token = localStorage.getItem("token");
        if (!token) return false;

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            return notification.readBy.includes(payload.id);
        } catch (e) {
            return false;
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "Salary": return <DollarSign size={20} className="text-success" />;
            case "Leave": return <Calendar size={20} className="text-warning" />;
            case "Important Work": return <AlertTriangle size={20} className="text-danger" />;
            case "General":
            case "general":
            default: return <Briefcase size={20} className="text-primary" />;
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
                .filter-container {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                .filter-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    color: #cbd5e1;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .filter-btn:hover {
                    background: rgba(59, 130, 246, 0.1);
                    color: #fff;
                }
                .filter-btn.active {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }
                .notifications-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                    max-width: 900px;
                    margin: 0 auto;
                }
                .notification-card {
                    background: #1e293b;
                    border-radius: 12px;
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    padding: 1.5rem;
                    display: flex;
                    gap: 1.25rem;
                    transition: all 0.2s;
                    position: relative;
                    overflow: hidden;
                }
                .notification-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
                    border-color: rgba(59, 130, 246, 0.3);
                }
                .notification-card.unread {
                    background: #1e293b;
                    border-left: 4px solid #3b82f6;
                }
                .notification-card.unread::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
                    pointer-events: none;
                }
                .icon-container {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: rgba(30, 41, 59, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .content-section {
                    flex: 1;
                }
                .notif-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }
                .notif-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #f1f5f9;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .notif-time {
                    font-size: 0.85rem;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
                .notif-message {
                    color: #94a3b8;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }
                .actions-container {
                    display: flex;
                    justify-content: flex-end;
                }
                .btn-mark-read {
                    background: transparent;
                    color: #3b82f6;
                    border: 1px solid transparent;
                    padding: 0.4rem 0.8rem;
                    font-size: 0.9rem;
                    font-weight: 500;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    transition: all 0.2s;
                }
                .btn-mark-read:hover {
                    background: rgba(59, 130, 246, 0.1);
                }
                .read-status {
                    color: #10b981;
                    font-size: 0.9rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
                .empty-state {
                    text-align: center;
                    padding: 4rem;
                    color: #64748b;
                }
                .badge-urgent {
                    background: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                .text-primary { color: #60a5fa !important; }
                .text-success { color: #34d399 !important; }
                .text-warning { color: #fbbf24 !important; }
                .text-danger { color: #f87171 !important; }
            `}</style>

            <div className="header-section">
                <div>
                    <button className="btn-back" onClick={() => navigate('/employee-dashboard')}>
                        &larr; Back to Dashboard
                    </button>
                    <h1 className="page-title">My Notifications</h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Stay updated with company announcements</p>
                </div>
                <div className="filter-container">
                    {["All", "Salary", "Leave", "Important Work", "General"].map(type => (
                        <button
                            key={type}
                            className={`filter-btn ${filter === type ? "active" : ""}`}
                            onClick={() => setFilter(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="empty-state">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="notifications-grid">
                    {getFilteredNotifications().length === 0 ? (
                        <div className="empty-state">
                            <Bell size={64} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <h3>No Notifications</h3>
                            <p>You're all caught up! No {filter !== 'All' ? filter.toLowerCase() : ''} notifications found.</p>
                        </div>
                    ) : (
                        getFilteredNotifications().map(notif => {
                            const read = isRead(notif);
                            return (
                                <div key={notif._id} className={`notification-card ${!read ? "unread" : ""}`}>
                                    <div className="icon-container">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="content-section">
                                        <div className="notif-header">
                                            <h5 className="notif-title">
                                                {notif.title}
                                                {notif.isImportant && <span className="badge-urgent">Urgent</span>}
                                            </h5>
                                            <small className="notif-time">
                                                <Clock size={14} />
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </small>
                                        </div>
                                        <p className="notif-message">{notif.message}</p>

                                        <div className="actions-container">
                                            {!read ? (
                                                <button
                                                    className="btn-mark-read"
                                                    onClick={() => markAsRead(notif._id)}
                                                >
                                                    <Check size={16} /> Mark as Read
                                                </button>
                                            ) : (
                                                <span className="read-status">
                                                    <CheckCircle size={16} /> Read
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeNotifications;
