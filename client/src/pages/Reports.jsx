import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const Reports = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("employee");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [selectedDomain, setSelectedDomain] = useState("All");
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Data States
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        pendingTasks: 0,
        totalPayroll: 0
    });
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [payrolls, setPayrolls] = useState([]);

    // Constants
    const DOMAINS = ["All", "HR", "MANAGER", "DEVELOPER", "TESTER", "DESIGNER"]; // Strict domains as requested
    const MONTHS = [
        { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
        { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
        { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
        { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
    ];
    const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const token = localStorage.getItem("token");
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    // Initial Load - Stats
    useEffect(() => {
        fetchStats();
    }, [selectedMonth, selectedYear]); // Re-fetch payroll stats if month/year changes

    // Data Load - Tab specific
    useEffect(() => {
        fetchReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedDomain, selectedMonth, selectedYear]);

    const fetchStats = async () => {
        try {
            const res = await axios.get("http://localhost:5001/api/admin/stats/summary", {
                ...config,
                params: { month: selectedMonth, year: selectedYear }
            });
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        setError(null);

        const params = {};
        if (selectedDomain && selectedDomain !== "All") params.domain = selectedDomain;

        try {
            if (activeTab === "employee") {
                const res = await axios.get("http://localhost:5001/api/admin/employees", { ...config, params });
                setEmployees(res.data);
            } else if (activeTab === "attendance") {
                params.month = selectedMonth;
                params.year = selectedYear;
                const res = await axios.get("http://localhost:5001/api/attendance/all", { ...config, params });
                setAttendance(res.data);
            } else if (activeTab === "task") {
                const res = await axios.get("http://localhost:5001/api/tasks/all", { ...config, params });
                setTasks(res.data);
            } else if (activeTab === "payroll") {
                params.month = selectedMonth;
                params.year = selectedYear;
                const res = await axios.get("http://localhost:5001/api/payroll/all", { ...config, params });
                setPayrolls(res.data);
            }
        } catch (err) {
            console.error(`Error fetching ${activeTab} data:`, err);
            setError("Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = (data, name) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${name}_Report.xlsx`);
    };

    // --- Chart Data Helpers ---
    const getEmployeeChartData = () => {
        const counts = {};
        employees.forEach(emp => {
            const domain = emp.domain || "Unknown";
            counts[domain] = (counts[domain] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    };

    const getAttendanceChartData = () => {
        const counts = { Present: 0, Absent: 0, Late: 0, "Half Day": 0 };
        attendance.forEach(att => {
            if (counts[att.status] !== undefined) counts[att.status]++;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    };

    const getTaskChartData = () => {
        const counts = { Pending: 0, "In Progress": 0, Completed: 0 };
        tasks.forEach(task => {
            if (counts[task.status] !== undefined) counts[task.status]++;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    };

    const getPayrollChartData = () => {
        const counts = { Paid: 0, Pending: 0 };
        payrolls.forEach(p => {
            if (p.paymentStatus === "Paid") counts.Paid++;
            else counts.Pending++;
        });
        return [
            { name: "Paid", value: counts.Paid },
            { name: "Pending", value: counts.Pending }
        ];
    };

    // --- Render Components ---

    const renderKPICards = () => (
        <div className="kpi-grid">
            <div className="kpi-card">
                <div className="icon-wrapper blue">
                    <i className="bi bi-people-fill"></i>
                </div>
                <div className="kpi-info">
                    <h4>Total Employees</h4>
                    <h2>{stats.totalEmployees}</h2>
                </div>
            </div>
            <div className="kpi-card">
                <div className="icon-wrapper green">
                    <i className="bi bi-calendar-check-fill"></i>
                </div>
                <div className="kpi-info">
                    <h4>Present Today</h4>
                    <h2>{stats.presentToday}</h2>
                </div>
            </div>
            <div className="kpi-card">
                <div className="icon-wrapper orange">
                    <i className="bi bi-hourglass-split"></i>
                </div>
                <div className="kpi-info">
                    <h4>Pending Tasks</h4>
                    <h2>{stats.pendingTasks}</h2>
                </div>
            </div>
            <div className="kpi-card">
                <div className="icon-wrapper purple">
                    <i className="bi bi-cash-stack"></i>
                </div>
                <div className="kpi-info">
                    <h4>Total Payroll ({MONTHS[selectedMonth - 1].label})</h4>
                    <h2>${stats.totalPayroll?.toLocaleString()}</h2>
                </div>
            </div>
        </div>
    );

    const renderFilters = () => (
        <div className="filters-bar">
            {/* Domain Filter - Common for all */}
            <div className="filter-group">
                <label>Domain</label>
                <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)}>
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            {/* Time Filters - Only for relevant tabs AND for KPI context */}
            {(activeTab === "attendance" || activeTab === "payroll" || true) && (
                <>
                    <div className="filter-group">
                        <label>Month</label>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Year</label>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </>
            )}

            <button className="btn-refresh" onClick={() => { fetchStats(); fetchReportData(); }}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
        </div>
    );

    const renderEmployeeTable = () => {
        // Prepare export data
        const exportData = employees.map(emp => ({
            Name: emp.fullName || emp.name,
            Email: emp.email,
            Phone: emp.phone,
            Domain: emp.domain,
            "Joining Date": new Date(emp.createdAt).toLocaleDateString(),
            Status: "Active"
        }));

        return (
            <div className="report-card fade-in">
                <div className="chart-section-wrapper">
                    <h3>Employee Distribution</h3>
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={getEmployeeChartData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {getEmployeeChartData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="report-header">
                    <h3>Employee Directory</h3>
                    <button className="btn-export" onClick={() => exportToExcel(exportData, "Employees")}>
                        Export Excel
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Domain</th>
                                <th>Joining Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp._id}>
                                    <td className="fw-bold">{emp.fullName || emp.name}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.phone || "N/A"}</td>
                                    <td><span className="badge domain-badge">{emp.domain}</span></td>
                                    <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                                    <td><span className="badge status-success">Active</span></td>
                                </tr>
                            ))}
                            {employees.length === 0 && <tr><td colSpan="6" className="no-data">No employees found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAttendanceTable = () => {
        const exportData = attendance.map(att => ({
            "Employee Name": att.employeeId?.fullName || "Unknown",
            Date: new Date(att.date).toLocaleDateString(),
            Status: att.status,
            "Check-in": att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : "-",
            "Check-out": att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : "-"
        }));

        return (
            <div className="report-card fade-in">
                <div className="chart-section-wrapper">
                    <h3>Attendance Overview</h3>
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={getAttendanceChartData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                <Legend />
                                <Bar dataKey="value" fill="#10b981" barSize={50}>
                                    {getAttendanceChartData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="report-header">
                    <h3>Attendance Report</h3>
                    <button className="btn-export" onClick={() => exportToExcel(exportData, "Attendance")}>
                        Export Excel
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map(att => (
                                <tr key={att._id}>
                                    <td className="fw-bold">{att.employeeId?.fullName || "Unknown"}</td>
                                    <td>{new Date(att.date).toLocaleDateString()}</td>
                                    <td><span className={`badge status-${att.status.toLowerCase().replace(" ", "")}`}>{att.status}</span></td>
                                    <td>{att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : "-"}</td>
                                    <td>{att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : "-"}</td>
                                </tr>
                            ))}
                            {attendance.length === 0 && <tr><td colSpan="5" className="no-data">No attendance records found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderTaskTable = () => {
        const exportData = tasks.map(t => ({
            "Task Title": t.title,
            "Assigned To": t.assignedTo?.fullName || t.assignedTo?.email || "Unknown",
            "Assigned Date": new Date(t.createdAt).toLocaleDateString(),
            Status: t.status,
            "Completion Date": t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "-"
        }));

        return (
            <div className="report-card fade-in">
                <div className="chart-section-wrapper">
                    <h3>Task Progress</h3>
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={getTaskChartData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {getTaskChartData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="report-header">
                    <h3>Task Report</h3>
                    <button className="btn-export" onClick={() => exportToExcel(exportData, "Tasks")}>
                        Export Excel
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Task Title</th>
                                <th>Assigned To</th>
                                <th>Assigned Date</th>
                                <th>Status</th>
                                <th>Completion Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(t => (
                                <tr key={t._id}>
                                    <td className="fw-bold">{t.title}</td>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-icon small">{t.assignedTo?.fullName?.charAt(0) || "U"}</div>
                                            <div>
                                                <div>{t.assignedTo?.fullName || "Unknown"}</div>
                                                <small style={{ opacity: 0.7 }}>{t.assignedTo?.email}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                                    <td><span className={`badge status-${t.status.toLowerCase().replace(" ", "")}`}>{t.status}</span></td>
                                    <td>{t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "-"}</td>
                                </tr>
                            ))}
                            {tasks.length === 0 && <tr><td colSpan="5" className="no-data">No tasks found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderPayrollTable = () => {
        const exportData = payrolls.map(p => ({
            "Employee Name": p.employeeId?.fullName || "Unknown",
            Month: `${p.month}/${p.year}`,
            "Basic Salary": p.baseSalary,
            Deductions: p.totalDeductions,
            "Net Salary": p.netSalary,
            "Payment Status": p.paymentStatus
        }));

        return (
            <div className="report-card fade-in">
                <div className="chart-section-wrapper">
                    <h3>Payroll Status</h3>
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={getPayrollChartData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                <Legend />
                                <Bar dataKey="value" fill="#6366f1" barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="report-header">
                    <h3>Payroll Report</h3>
                    <button className="btn-export" onClick={() => exportToExcel(exportData, "Payroll")}>
                        Export Excel
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Month</th>
                                <th>Basic Salary</th>
                                <th>Deductions</th>
                                <th>Net Salary</th>
                                <th>Payment Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.map(p => (
                                <tr key={p._id}>
                                    <td className="fw-bold">{p.employeeId?.fullName || "Unknown"}</td>
                                    <td>{p.month}/{p.year}</td>
                                    <td>\${p.baseSalary}</td>
                                    <td className="text-danger">-\${p.totalDeductions?.toFixed(2)}</td>
                                    <td className="text-success fw-bold">\${p.netSalary?.toFixed(2)}</td>
                                    <td><span className={`badge status-${p.paymentStatus === 'Paid' ? 'completed' : 'pending'}`}>{p.paymentStatus}</span></td>
                                </tr>
                            ))}
                            {payrolls.length === 0 && <tr><td colSpan="6" className="no-data">No payroll records found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="reports-page">
            <style>{`
                /* Modern Dark/Vibrant Theme Variables */
                :root {
                    --bg-dark: #0f172a;
                    --bg-card: #1e293b;
                    --text-primary: #f8fafc;
                    --text-secondary: #94a3b8;
                    --accent-primary: #6366f1; /* Indigo */
                    --accent-secondary: #ec4899; /* Pink */
                    --accent-success: #10b981;
                    --accent-warning: #f59e0b;
                    --accent-danger: #ef4444;
                    --table-border: #334155;
                    --glass-bg: rgba(30, 41, 59, 0.7);
                }

                .reports-page {
                    min-height: 100vh;
                    background-color: var(--bg-dark);
                    color: var(--text-primary);
                    padding: 2rem;
                    font-family: 'Inter', sans-serif;
                }

                h2, h3, h4 { margin: 0; color: var(--text-primary); }

                /* Header */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--table-border);
                }

                .back-btn {
                    background: rgba(255,255,255,0.1);
                    color: var(--text-primary);
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .back-btn:hover { background: rgba(255,255,255,0.2); }

                /* KPI Grid */
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }

                .kpi-card {
                    background: var(--bg-card);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    border: 1px solid var(--table-border);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s;
                }
                .kpi-card:hover { transform: translateY(-5px); }

                .icon-wrapper {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                .icon-wrapper.blue { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
                .icon-wrapper.green { background: rgba(16, 185, 129, 0.15); color: #34d399; }
                .icon-wrapper.orange { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
                .icon-wrapper.purple { background: rgba(236, 72, 153, 0.15); color: #f472b6; }

                .kpi-info h4 { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
                .kpi-info h2 { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); }

                /* Filters Bar */
                .filters-bar {
                    display: flex;
                    gap: 1.5rem;
                    background: var(--bg-card);
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    border: 1px solid var(--table-border);
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .filter-group label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                }

                .filter-group select {
                    background: var(--bg-dark);
                    color: var(--text-primary);
                    border: 1px solid var(--table-border);
                    padding: 0.6rem 1rem;
                    border-radius: 8px;
                    min-width: 150px;
                    outline: none;
                    cursor: pointer;
                }

                .btn-refresh {
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: opacity 0.2s;
                }
                .btn-refresh:hover { opacity: 0.9; }

                /* Tabs */
                .tabs-container {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    overflow-x: auto;
                    padding-bottom: 5px;
                }

                .tab-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    padding: 0.75rem 1.5rem;
                    cursor: pointer;
                    font-weight: 600;
                    border-radius: 8px;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    white-space: nowrap;
                }

                .tab-btn:hover {
                    background: rgba(255,255,255,0.05);
                    color: var(--text-primary);
                }

                .tab-btn.active {
                    background: var(--accent-primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                }

                /* Report Card */
                .report-card {
                    background: var(--bg-card);
                    border-radius: 16px;
                    padding: 2rem;
                    border: 1px solid var(--table-border);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }

                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .btn-export {
                    background: var(--accent-success);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: transform 0.2s;
                }
                .btn-export:hover { transform: translateY(-2px); }

                /* Table Styling */
                .table-responsive {
                    overflow-x: auto;
                }

                .styled-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 1rem;
                    font-size: 0.95rem;
                }

                .styled-table thead th {
                    text-align: left;
                    padding: 1rem;
                    background: rgba(255,255,255,0.03);
                    color: var(--text-secondary);
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.05em;
                    border-bottom: 2px solid var(--table-border);
                }

                .styled-table tbody tr {
                    transition: background 0.2s;
                }
                
                .styled-table tbody tr:hover {
                    background: rgba(255,255,255,0.02);
                }

                .styled-table td {
                    padding: 1rem;
                    border-bottom: 1px solid var(--table-border);
                    color: var(--text-primary);
                    vertical-align: middle;
                }

                /* User Cell */
                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .user-icon {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    font-size: 0.9rem;
                }
                .user-icon.small { width: 28px; height: 28px; font-size: 0.8rem; }

                /* Badges */
                .badge {
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    display: inline-block;
                }
                
                .domain-badge {
                    background: rgba(99, 102, 241, 0.15);
                    color: #a5b4fc;
                    border: 1px solid rgba(99, 102, 241, 0.3);
                }

                .status-present, .status-completed, .status-paid, .status-success, .status-active {
                    background: rgba(16, 185, 129, 0.15);
                    color: #34d399;
                }
                
                .status-absent, .status-failed, .status-late {
                    background: rgba(239, 68, 68, 0.15);
                    color: #fca5a5;
                }

                .status-pending, .status-inprogress {
                    background: rgba(245, 158, 11, 0.15);
                    color: #fcd34d;
                }

                /* Utility */
                .text-success { color: var(--accent-success) !important; }
                .text-danger { color: var(--accent-danger) !important; }
                .fw-bold { font-weight: 700; }
                .no-data { text-align: center; padding: 3rem; color: var(--text-secondary); font-style: italic; }

                /* Animation */
                .fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .chart-section-wrapper {
                    margin-bottom: 2rem;
                    background: rgba(15, 23, 42, 0.4);
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid var(--table-border);
                }
                .chart-section-wrapper h3 {
                    margin-bottom: 1rem;
                    font-size: 1.1rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
            `}</style>

            <div className="page-header">
                <div>
                    <h2>Reports & Analytics</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Real-time insights and database-driven records.
                    </p>
                </div>
                <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
                    <i className="bi bi-arrow-left"></i> Back to Dashboard
                </button>
            </div>

            {renderKPICards()}

            {renderFilters()}

            <div className="tabs-container">
                <button className={`tab-btn ${activeTab === "employee" ? "active" : ""}`} onClick={() => setActiveTab("employee")}>
                    <i className="bi bi-people-fill"></i> Employees
                </button>
                <button className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`} onClick={() => setActiveTab("attendance")}>
                    <i className="bi bi-calendar-check-fill"></i> Attendance
                </button>
                <button className={`tab-btn ${activeTab === "task" ? "active" : ""}`} onClick={() => setActiveTab("task")}>
                    <i className="bi bi-list-task"></i> Tasks
                </button>
                <button className={`tab-btn ${activeTab === "payroll" ? "active" : ""}`} onClick={() => setActiveTab("payroll")}>
                    <i className="bi bi-cash-stack"></i> Payroll
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner-border text-light" role="status"></div>
                    <p className="mt-3 text-secondary">Loading report data...</p>
                </div>
            ) : (
                <div className="report-container-inner">
                    {activeTab === "employee" && renderEmployeeTable()}
                    {activeTab === "attendance" && renderAttendanceTable()}
                    {activeTab === "task" && renderTaskTable()}
                    {activeTab === "payroll" && renderPayrollTable()}
                </div>
            )}
        </div>
    );
};

export default Reports;
