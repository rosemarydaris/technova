import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Clock, AlertTriangle, Briefcase, DollarSign, Calendar, Filter, ChevronRight, CheckCircle, Shield, Zap, TrendingUp, Monitor, Info } from "lucide-react";

const EmployeeNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

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
            setMessage({ type: "success", text: "Marked as Read" });
            fetchNotifications();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Error marking as read", error);
            setMessage({ type: "error", text: "Failed to mark as read" });
            setTimeout(() => setMessage(null), 3000);
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
                @keyframes gradient-bg {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .page-container {
                    min-height: 100vh;
                    background: radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%);
                    padding: 3rem 2rem;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: #fff;
                    position: relative;
                    overflow: hidden;
                }

                .page-container::before {
                    content: '';
                    position: absolute;
                    top: -10%;
                    left: -10%;
                    width: 40%;
                    height: 40%;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
                    filter: blur(80px);
                    z-index: 0;
                    pointer-events: none;
                }

                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 3rem;
                    position: relative;
                    z-index: 1;
                }

                .page-title {
                    font-size: 2.75rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin: 0;
                }

                .btn-back {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    padding: 0.6rem 1.2rem;
                    border-radius: 10px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 1.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .btn-back:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    transform: translateX(-4px);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .filter-container {
                    display: flex;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                }

                .filter-btn {
                    padding: 0.6rem 1.25rem;
                    border-radius: 12px;
                    background: transparent;
                    border: 1px solid transparent;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .filter-btn:hover {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.05);
                }

                .filter-btn.active {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
                    transform: translateY(-1px);
                }

                .notifications-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.25rem;
                    max-width: 950px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 1;
                }

                .notification-card {
                    background: rgba(30, 41, 59, 0.4);
                    backdrop-filter: blur(12px);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 1.75rem;
                    display: flex;
                    gap: 1.5rem;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .notification-card:hover {
                    background: rgba(30, 41, 59, 0.6);
                    transform: translateY(-4px) scale(1.01);
                    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
                    border-color: rgba(59, 130, 246, 0.2);
                }

                .notification-card.unread {
                    border-left: 5px solid #3b82f6;
                    background: rgba(59, 130, 246, 0.03);
                }

                .icon-container {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    background: rgba(15, 23, 42, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
                }

                .notif-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #f8fafc;
                    margin: 0 0 0.4rem 0;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .notif-time {
                    font-size: 0.8rem;
                    color: #64748b;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .notif-message {
                    color: #94a3b8;
                    font-size: 1rem;
                    line-height: 1.6;
                    margin-bottom: 1.25rem;
                }

                .btn-mark-read {
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    padding: 0.5rem 1.25rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s;
                }

                .btn-mark-read:hover {
                    background: #3b82f6;
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .read-status {
                    color: #10b981;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                }

                .badge-urgent {
                    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
                    color: white;
                    padding: 0.25rem 0.6rem;
                    border-radius: 6px;
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
                }

                .alert {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    z-index: 100;
                    padding: 1.25rem 2rem;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .alert-success { background: rgba(16, 185, 129, 0.9); color: #fff; }
                .alert-error { background: rgba(239, 68, 68, 0.9); color: #fff; }

                .empty-state {
                    text-align: center;
                    padding: 6rem 2rem;
                    background: rgba(30, 41, 59, 0.2);
                    border-radius: 32px;
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    margin-top: 2rem;
                }

                .empty-state h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin-bottom: 0.75rem;
                }

                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(59, 130, 246, 0.1);
                    border-top: 3px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .text-primary { color: #60a5fa !important; }
                .text-success { color: #34d399 !important; }
                .text-warning { color: #fbbf24 !important; }
                .text-danger { color: #f87171 !important; }

                /* Intelligence Center Additions */
                .notif-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    max-width: 950px;
                    margin: 0 auto 3rem;
                    position: relative;
                    z-index: 1;
                }

                .notif-stat-card {
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 20px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    transition: all 0.3s ease;
                }

                .notif-stat-card:hover {
                    transform: translateY(-5px);
                    background: rgba(15, 23, 42, 0.6);
                    border-color: rgba(59, 130, 246, 0.3);
                }

                .stat-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-info .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #fff;
                    display: block;
                }

                .stat-info .stat-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .notif-card-new {
                    background: rgba(30, 41, 59, 0.5);
                    backdrop-filter: blur(20px);
                    border-radius: 24px;
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    padding: 2rem;
                    display: flex;
                    gap: 1.75rem;
                    margin-bottom: 1.5rem;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                }

                .notif-card-new:hover {
                    transform: scale(1.02) translateY(-5px);
                    background: rgba(30, 41, 59, 0.7);
                    border-color: rgba(59, 130, 246, 0.3);
                }

                .notif-badge-group {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1rem;
                }

                .type-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                }

                .glow-salary { background: #34d399; box-shadow: 0 0 15px rgba(52, 211, 153, 0.5); }
                .glow-leave { background: #fbbf24; box-shadow: 0 0 15px rgba(251, 191, 36, 0.5); }
                .glow-urgent { background: #f87171; box-shadow: 0 0 15px rgba(248, 113, 113, 0.5); }
                .glow-general { background: #60a5fa; box-shadow: 0 0 15px rgba(96, 165, 250, 0.5); }

                .empty-glow-bell {
                    font-size: 5rem;
                    color: rgba(59, 130, 246, 0.1);
                    margin-bottom: 2rem;
                    display: block;
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .notif-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.75rem;
                }
            `}</style>

            <div className="header-section">
                <div>
                    <button className="btn-back" onClick={() => navigate('/employee-dashboard')}>
                        <ChevronRight style={{ transform: 'rotate(180deg)' }} /> Back to Dashboard
                    </button>
                    <h1 className="page-title">My Notifications</h1>
                    <p style={{ color: '#64748b', marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: '500' }}>Stay updated with company announcements</p>
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

            {message && (
                <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
                    {message.type === "success" ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>{message.text}</span>
                </div>
            )}

            {loading ? (
                <div className="empty-state">
                    <div className="spinner"></div>
                    <p style={{ marginTop: '1.5rem', color: '#64748b' }}>Syncing Intelligence Reports...</p>
                </div>
            ) : (
                <>
                    <div className="notif-stats-grid">
                        <div className="notif-stat-card">
                            <div className="stat-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                <Bell size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{notifications.filter(n => !isRead(n)).length}</span>
                                <span className="stat-label">Unread Messages</span>
                            </div>
                        </div>
                        <div className="notif-stat-card">
                            <div className="stat-icon-box" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{notifications.filter(n => n.isImportant).length}</span>
                                <span className="stat-label">Urgent Actions</span>
                            </div>
                        </div>
                        <div className="notif-stat-card">
                            <div className="stat-icon-box" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#10b981' }}>
                                <Zap size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{notifications.length}</span>
                                <span className="stat-label">Total History</span>
                            </div>
                        </div>
                    </div>

                    <div className="notifications-grid">
                        {getFilteredNotifications().length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-glow-bell">🔔</div>
                                <h3>Clear Horizon</h3>
                                <p>No {filter !== 'All' ? filter.toLowerCase() : ''} notifications found at the moment.</p>
                            </div>
                        ) : (
                            getFilteredNotifications().map(notif => {
                                const read = isRead(notif);
                                const glowClass = notif.type === 'Salary' ? 'glow-salary' :
                                    notif.type === 'Leave' ? 'glow-leave' :
                                        notif.isImportant ? 'glow-urgent' : 'glow-general';
                                return (
                                    <div key={notif._id} className="notif-card-new">
                                        <div className={`type-glow ${glowClass}`}></div>
                                        <div className="icon-container" style={{ borderRadius: '20px' }}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="notif-item-header">
                                                <div>
                                                    <h5 className="notif-title" style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>
                                                        {notif.title}
                                                    </h5>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <span className="notif-time">
                                                            <Clock size={14} />
                                                            {new Date(notif.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <span className="notif-time" style={{ color: '#3b82f6' }}>
                                                            <Shield size={14} />
                                                            {notif.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                {notif.isImportant && <span className="badge-urgent">Action Required</span>}
                                            </div>

                                            <p className="notif-message" style={{ fontSize: '1.05rem', color: '#cbd5e1' }}>{notif.message}</p>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                                <div className="notif-badge-group">
                                                    {read ? (
                                                        <span className="read-status" style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '0.4rem 1rem', borderRadius: '100px' }}>
                                                            <CheckCircle size={16} /> Seen
                                                        </span>
                                                    ) : (
                                                        <span className="read-status" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.4rem 1rem', borderRadius: '100px' }}>
                                                            <Info size={16} /> Pending Review
                                                        </span>
                                                    )}
                                                </div>

                                                {!read && (
                                                    <button
                                                        className="btn-mark-read"
                                                        onClick={() => markAsRead(notif._id)}
                                                        style={{ borderRadius: '12px', padding: '0.6rem 1.5rem' }}
                                                    >
                                                        <Check size={18} /> Acknowledge
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default EmployeeNotifications;
