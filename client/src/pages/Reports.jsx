import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
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
import { Link, useNavigate } from "react-router-dom"; // Add Navigation
import { useUser } from "../context/UserContext"; // Assuming we might need context, though mostly fetching

const Reports = () => {
    const navigate = useNavigate(); // Hook for navigation
    const [activeTab, setActiveTab] = useState("employee");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Data States
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [attendanceSummary, setAttendanceSummary] = useState({});
    const [tasks, setTasks] = useState([]);
    const [taskStats, setTaskStats] = useState({});
    const [payrolls, setPayrolls] = useState([]);
    const [payrollSummary, setPayrollSummary] = useState({});

    const [logs, setLogs] = useState([]);

    const token = localStorage.getItem("token");
    const config = {
        headers: { Authorization: `Bearer ${token}` },
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === "employee") {
                const res = await axios.get("http://localhost:5001/api/admin/employees", config);
                setEmployees(res.data);
            } else if (activeTab === "attendance") {
                try {
                    const allRes = await axios.get("http://localhost:5001/api/attendance/all", config);
                    setAttendance(allRes.data);
                    // Calculate summary from the full data instead of a separate endpoint
                    const total = allRes.data.length;
                    const present = allRes.data.filter(a => a.status === 'Present').length;
                    setAttendanceSummary({ totalRecords: total, present: present });
                } catch (err) {
                    console.error("Error fetching attendance:", err);
                }
            } else if (activeTab === "task") {
                const [allRes, statsRes] = await Promise.all([
                    axios.get("http://localhost:5001/api/tasks/all", config),
                    axios.get("http://localhost:5001/api/tasks/stats", config)
                ]);
                setTasks(allRes.data);
                setTaskStats(statsRes.data);
            } else if (activeTab === "payroll") {
                // Fetch payrolls - try various endpoints or robustly handle if some fail
                // Assuming /api/payroll/all exists
                const allRes = await axios.get("http://localhost:5001/api/payroll/all", config);
                setPayrolls(allRes.data);

                // Fetch summary if available, else derive from allRes
                // Fetch summary if available, else derive from allRes
                try {
                    const currentDate = new Date();
                    const currentMonth = currentDate.getMonth() + 1;
                    const currentYear = currentDate.getFullYear();

                    const summaryRes = await axios.get("http://localhost:5001/api/payroll/summary/monthly", {
                        ...config,
                        params: { month: currentMonth, year: currentYear }
                    });
                    setPayrollSummary(summaryRes.data);
                } catch (err) {
                    console.warn("Payroll summary endpoint fetching failed:", err.message);
                }
            } else if (activeTab === "profile") {
                const res = await axios.get("http://localhost:5001/api/admin/logs", config);
                setLogs(res.data);
            }
        } catch (err) {
            console.error("Error fetching report data:", err);
            // Don't block UI mostly, just show what we can
            // For tasks/attendance, errors might happen if data empty
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = (data, fileName) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `${fileName}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // --- Render Helpers ---

    const renderTabs = () => (
        <div className="tabs-container">
            {["employee", "attendance", "task", "profile", "payroll"].map((tab) => (
                <button
                    key={tab}
                    className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Reports
                </button>
            ))}
        </div>
    );

    const renderEmployeeReport = () => {
        // Filter out admin user
        const filteredEmployees = employees.filter(emp => emp.email !== "admin@technova.com");

        // Filter data for export to match requirements (remove designation, ensure domain)
        const exportData = filteredEmployees.map(emp => ({
            Name: emp.fullName || emp.name, // Use fullName prioritizing over name
            Email: emp.email,
            Domain: emp.domain || emp.department || 'N/A', // Fallback if department still exists in backend
            "Phone Number": emp.phone || emp.phoneNumber || 'N/A' // Replace Joining Date with Phone
        }));

        return (
            <div className="report-content fade-in">
                <div className="report-header">
                    <h3>Employee Directory ({filteredEmployees.length})</h3>
                    <button className="btn-export" onClick={() => exportToExcel(exportData, "Employees")}>
                        <i className="bi bi-file-earmark-excel"></i> Export Excel
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Domain</th>
                                <th>Phone Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp) => (
                                <tr key={emp._id}>
                                    <td>{emp.fullName || emp.name}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.domain}</td>
                                    <td>{emp.phone || emp.phoneNumber || 'N/A'}</td>
                                </tr>
                            ))}
                            {filteredEmployees.length === 0 && <tr><td colSpan="4" className="no-data">No employees found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAttendanceReport = () => {
        // Prepare export data with correct field names
        const exportData = attendance.map(att => ({
            Employee: att.employeeId?.fullName || att.employeeId?.name || att.employeeId?.email || "Unknown",
            Date: new Date(att.date).toLocaleDateString(),
            Status: att.status,
            "Check In": att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : "-",
            "Check Out": att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : "-"
        }));

        return (
            <div className="report-content fade-in">
                <div className="report-header">
                    <h3>Attendance Overview</h3>
                    <button className="btn-export" onClick={() => exportToExcel(exportData, "Attendance")}>
                        <i className="bi bi-file-earmark-excel"></i> Export Excel
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h4>Total Records</h4>
                        <div className="number">{attendance.length}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Present</h4>
                        <div className="number">{attendance.filter(a => a.status === 'Present').length}</div>
                    </div>
                </div>

                <div className="table-responsive mt-4">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map((att) => (
                                <tr key={att._id}>
                                    <td>{att.employeeId?.fullName || att.employeeId?.name || att.employeeId?.email || "Unknown"}</td>
                                    <td>{new Date(att.date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge status-${att.status?.toLowerCase() || 'present'}`}>
                                            {att.status}
                                        </span>
                                    </td>
                                    <td>{att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : "-"}</td>
                                    <td>{att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : "-"}</td>
                                </tr>
                            ))}
                            {attendance.length === 0 && <tr><td colSpan="5" className="no-data">No attendance records</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    };

    const renderTaskReport = () => {
        // Prepare chart data
        const statusData = [
            { name: "Pending", value: tasks.filter(t => t.status === "Pending").length, color: "#f6c23e" },
            { name: "In Progress", value: tasks.filter(t => t.status === "In Progress").length, color: "#36b9cc" },
            { name: "Completed", value: tasks.filter(t => t.status === "Completed").length, color: "#1cc88a" }
        ].filter(d => d.value > 0);

        return (
            <div className="report-content fade-in">
                <div className="report-header">
                    <h3>Task Performance</h3>
                    <button className="btn-export" onClick={() => exportToExcel(tasks, "Tasks")}>
                        <i className="bi bi-file-earmark-excel"></i> Export Excel
                    </button>
                </div>

                <div className="charts-container">
                    {statusData.length > 0 ? (
                        <div className="chart-wrapper">
                            <h4>Task Status Distribution</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <p className="no-chart-data">No task data for charts</p>}

                    {/* Can add another chart here for productivity over time if data exists */}
                </div>

                <div className="table-responsive mt-4">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Assigned To</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task._id}>
                                    <td>{task.title}</td>
                                    <td>{task.assignedTo?.name || task.assignedTo?.email}</td>
                                    <td><span className={`badge status-${task.status.toLowerCase().replace(' ', '')}`}>{task.status}</span></td>
                                    <td>{task.priority}</td>
                                    <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    };

    const renderProfileReport = () => {
        const profileLogs = logs.filter(l => l.action === "PROFILE_UPDATE");
        return (
            <div className="report-content fade-in">
                <div className="report-header">
                    <h3>Profile Updates Log</h3>
                    <button className="btn-export" onClick={() => exportToExcel(profileLogs, "ProfileUpdates")}>
                        <i className="bi bi-file-earmark-excel"></i> Export Excel
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Details</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profileLogs.map((log) => (
                                <tr key={log._id}>
                                    <td>{log.userName}</td>
                                    <td>{log.details}</td>
                                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                            {profileLogs.length === 0 && <tr><td colSpan="3" className="no-data">No profile update activity recorded</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };



    const renderPayrollReport = () => (
        <div className="report-content fade-in">
            <div className="report-header">
                <h3>Payroll & Salary Reports</h3>
                <button className="btn-export" onClick={() => exportToExcel(payrolls, "Payroll")}>
                    <i className="bi bi-file-earmark-excel"></i> Export Excel
                </button>
            </div>

            <div className="table-responsive">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Domain</th>
                            <th>Month/Year</th>
                            <th>Basic Salary</th>
                            <th>Bonuses</th>
                            <th>Deductions</th>
                            <th>Net Salary</th>
                            <th>Paid Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls.map((pay) => (
                            <tr key={pay._id}>
                                <td>{pay.employeeId?.fullName || pay.employeeId?.name || pay.employeeId?.email || "Unknown"}</td>
                                <td>{pay.employeeId?.domain || "N/A"}</td>
                                <td>{pay.month}/{pay.year}</td>
                                <td>${pay.baseSalary}</td>
                                <td className="text-success">+${pay.bonus || 0}</td>
                                <td className="text-danger">-${(pay.totalDeductions || 0).toFixed(2)}</td>
                                <td><strong>${pay.netSalary}</strong></td>
                                <td>
                                    <span className={`badge status-${pay.paymentStatus === 'Paid' ? 'completed' : 'pending'}`}>
                                        {pay.paymentStatus || "Pending"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {payrolls.length === 0 && <tr><td colSpan="7" className="no-data">No payroll records generated</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="reports-container">
            <style>{`
        /* --- Internal CSS for Reports Module --- */
        
        .reports-container {
            padding: 2rem;
            background: #f8f9fc;
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            color: #333 !important; /* Force dark text */
        }

        /* Tabs Navigation */
        .tabs-container {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            overflow-x: auto;
            padding-bottom: 1px;
            border-bottom: 2px solid #d1d3e2; /* Darker border */
        }

        .tab-btn {
            background: none;
            border: none;
            padding: 0.75rem 1.5rem;
            font-size: 0.95rem;
            font-weight: 700; /* Bolder */
            color: #5a5c69; /* Darker gray */
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
            border-radius: 8px 8px 0 0;
        }

        .tab-btn:hover {
            color: #2e59d9;
            background: #eaecf4;
        }

        .tab-btn.active {
            color: #2e59d9; /* Stronger Blue */
            border-bottom: 3px solid #2e59d9;
            background: #fff;
        }

        /* Report Content Area */
        .report-content {
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
            color: #333 !important;
        }

        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .report-header h3 {
            margin: 0;
            color: #4e73df;
            font-weight: 700;
        }

        .info-text {
            font-size: 0.85rem;
            color: #e74a3b;
            font-weight: 600;
        }

        .btn-export {
            background: #1cc88a;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: background 0.2s;
        }

        .btn-export:hover {
            background: #17a673;
        }

        /* Stats & Charts */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: #fff;
            padding: 1.5rem;
            border-left: 4px solid #4e73df;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
        }
        
        .stat-card h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            color: #4e73df; /* Changed from light gray to blue for visibility */
            font-weight: 700;
            text-transform: uppercase;
        }

        .stat-card .number {
            font-size: 1.5rem;
            font-weight: 800;
            color: #333; /* Dark black */
        }

        .charts-container {
            display: flex;
            flex-wrap: wrap;
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .chart-wrapper {
            flex: 1;
            min-width: 300px;
            background: #fff;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #d1d3e2;
        }
        
        .chart-wrapper h4 {
            text-align: center;
            color: #333;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .no-chart-data {
            text-align: center;
            color: #5a5c69;
            padding: 2rem;
            border: 1px dashed #d1d3e2;
            border-radius: 8px;
        }

        /* Tables */
        .table-responsive {
            overflow-x: auto;
        }

        .styled-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95rem;
            min-width: 600px;
            color: #333 !important; /* Ensure table text is dark */
        }

        .styled-table thead tr {
            background-color: #4e73df;
            color: #ffffff !important;
            text-align: left;
        }

        .styled-table th, .styled-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #d1d3e2;
            color: #333; /* Explicit black for cells */
        }

        .styled-table th {
            color: #fff !important; /* Explicit white for headers */
        }

        .styled-table tbody tr:nth-of-type(even) {
            background-color: #f8f9fc; /* Slightly lighter than previous gray */
        }

        .styled-table tbody tr:last-of-type {
            border-bottom: 2px solid #4e73df;
        }

        .styled-table tbody tr:hover {
            background-color: #eaecf4;
        }
        
        .styled-table td {
            font-weight: 500;
        }

        .no-data {
            text-align: center;
            padding: 2rem;
            color: #5a5c69;
            font-weight: 600;
        }

        /* Badges */
        .badge {
            padding: 0.4rem 0.75rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 700;
            color: white;
            text-transform: capitalize;
            display: inline-block;
        }

        .status-present, .status-completed, .status-success { background: #1cc88a; }
        .status-absent, .status-failed, .status-late { background: #e74a3b; }
        .status-leave, .status-pending { background: #f6c23e; color: #212529; /* Dark text on yellow */ }
        .status-inprogress { background: #36b9cc; }
        
        .text-success { color: #1cc88a !important; font-weight: 600; }
        .text-danger { color: #e74a3b !important; font-weight: 600; }
        .text-muted { color: #858796; }

        /* Animations */
        .fade-in {
            animation: fadeIn 0.4s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ color: '#5a5c69', marginBottom: '0.5rem', fontWeight: 800 }}>Admin Reports & Analytics</h2>
                    <p style={{ color: '#858796', margin: 0 }}>Comprehensive insights and data exports</p>
                </div>
                <button
                    onClick={() => navigate('/admin-dashboard')}
                    style={{
                        background: '#4e73df',
                        color: '#fff',
                        border: 'none',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem'
                    }}
                >
                    <i className="bi bi-arrow-left"></i> Back to Dashboard
                </button>
            </div>

            {renderTabs()}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Fetching report data...</p>
                </div>
            ) : (
                <>
                    {activeTab === "employee" && renderEmployeeReport()}
                    {activeTab === "attendance" && renderAttendanceReport()}
                    {activeTab === "task" && renderTaskReport()}
                    {activeTab === "profile" && renderProfileReport()}
                    {activeTab === "payroll" && renderPayrollReport()}
                </>
            )}
        </div>
    );
};

export default Reports;
