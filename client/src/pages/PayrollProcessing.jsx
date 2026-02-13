import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Payroll.css"; // Import styles

const PayrollProcessing = () => {
    const [employees, setEmployees] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null); // ID of payroll currently being processed
    const [successMessage, setSuccessMessage] = useState("");
    const [calculateAllLoading, setCalculateAllLoading] = useState(false);


    // Date State
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    // Summary State
    const [summary, setSummary] = useState({
        totalEmployees: 0,
        totalGross: 0,
        totalNet: 0,
        paidCount: 0,
        pendingCount: 0
    });

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchData();
    }, [token, navigate, selectedMonth, selectedYear]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            // Fetch all data concurrently
            const [empRes, payrollRes, summaryRes] = await Promise.all([
                axios.get("http://localhost:5001/api/employees/all", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:5001/api/payroll/all", {
                    params: { month: selectedMonth, year: selectedYear },
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:5001/api/payroll/summary/monthly", {
                    params: { month: selectedMonth, year: selectedYear },
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const allEmployees = empRes.data;
            const existingPayrolls = payrollRes.data;

            if (summaryRes.data) {
                setSummary({
                    totalEmployees: summaryRes.data.totalEmployees || 0,
                    totalGross: summaryRes.data.totalGrossSalary || 0,
                    totalNet: summaryRes.data.totalNetSalary || 0,
                    paidCount: summaryRes.data.paymentStatusBreakdown?.paid || 0,
                    pendingCount: summaryRes.data.paymentStatusBreakdown?.pending || 0
                });
            }

            setPayrolls(existingPayrolls);
            setEmployees(allEmployees);
        } catch (err) {
            console.error("Error fetching payroll data:", err);
            if (err.response?.status === 401) {
                navigate("/login");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Merge Employees with their Payroll Data
    const getMergedData = () => {
        return employees.map(emp => {
            // Find payroll for this employee
            const payroll = payrolls.find(p =>
                (p.employeeId && p.employeeId._id === emp._id) || // If populated
                (p.employeeId === emp._id) // If not populated (fallback)
            );

            return {
                ...emp,
                payroll: payroll || null // null means not yet calculated
            };
        });
    };

    const employeeData = getMergedData();

    // ================= ACTIONS =================

    const handleCalculate = async (employeeId) => {
        setProcessingId(employeeId);
        try {
            await axios.post(
                "http://localhost:5001/api/payroll/calculate",
                { employeeId, month: selectedMonth, year: selectedYear },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Refresh data in background
            fetchData(true);
            setSuccessMessage("Payroll calculated successfully");
            setTimeout(() => setSuccessMessage(""), 3000);

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Calculation failed. Ensure Salary Config exists.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleMarkPaid = async (payrollId) => {
        if (!window.confirm("Confirm marking this as PAID? This action cannot be undone.")) return;

        setProcessingId(payrollId);
        try {
            await axios.post(
                `http://localhost:5001/api/payroll/${payrollId}/mark-paid`,
                { paymentMethod: "Bank Transfer", paymentDate: new Date() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    const handleCalculateAll = async () => {
        if (!window.confirm(`Are you sure you want to calculate payroll for ALL employees for ${monthNames[selectedMonth - 1]} ${selectedYear}?`)) return;

        setCalculateAllLoading(true);
        try {
            const res = await axios.post(
                "http://localhost:5001/api/payroll/calculate-all",
                { month: selectedMonth, year: selectedYear },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(res.data.message);
            fetchData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Batch calculation failed");
        } finally {
            setCalculateAllLoading(false);
        }
    };

    // ================= EDIT PAYROLL =================
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [editFormData, setEditFormData] = useState({
        bonus: 0,
        deductions: {
            other: 0,
            lateDeduction: 0
        }
    });

    const openEditModal = (payroll) => {
        setSelectedPayroll(payroll);
        setEditFormData({
            bonus: payroll.bonus || 0,
            deductions: {
                other: payroll.deductions?.other || 0,
                lateDeduction: payroll.deductions?.lateDeduction || 0
            }
        });
        setEditModalOpen(true);
    };

    const handleUpdatePayroll = async (e) => {
        e.preventDefault();
        try {
            await axios.put(
                `http://localhost:5001/api/payroll/${selectedPayroll._id}`,
                {
                    bonus: Number(editFormData.bonus),
                    deductions: {
                        other: Number(editFormData.deductions.other),
                        lateDeduction: Number(editFormData.deductions.lateDeduction)
                    }
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditModalOpen(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Update failed");
        }
    };

    const handleGeneratePayslip = async (payrollId) => {
        setProcessingId(payrollId);
        try {
            // 1. Generate the payslip on server
            const res = await axios.post(
                `http://localhost:5001/api/payroll/${payrollId}/generate-payslip`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 2. Download the file if generated
            if (res.data.fileName) {
                try {
                    const downloadRes = await axios.get(
                        `http://localhost:5001/api/payroll/download/${res.data.fileName}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                            responseType: 'blob'
                        }
                    );

                    // Create blob link to download
                    const url = window.URL.createObjectURL(new Blob([downloadRes.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', res.data.fileName);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                    setSuccessMessage("Payslip downloaded successfully");
                    setTimeout(() => setSuccessMessage(""), 3000);
                } catch (dlErr) {
                    console.error("Download failed", dlErr);
                    alert("Payslip generated but failed to download.");
                }
            }

            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Payslip generation failed");
        } finally {
            setProcessingId(null);
        }
    };

    // Helper for Month Names
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">💸 Payroll Processing</h1>
                    <p className="page-subtitle">Calculate and manage monthly salaries</p>
                    {refreshing && <span style={{ fontSize: '0.8rem', color: '#60a5fa', marginLeft: '0.5rem' }}>🔄 Refreshing...</span>}
                    {successMessage && <span style={{ fontSize: '0.9rem', color: '#34d399', marginLeft: '1rem', fontWeight: 'bold' }}>✅ {successMessage}</span>}
                </div>

                <div className="flex-gap">
                    <button
                        onClick={handleCalculateAll}
                        disabled={calculateAllLoading || loading}
                        className="btn btn-primary"
                    >
                        {calculateAllLoading ? "Processing..." : "⚡ Calculate All"}
                    </button>
                    <button
                        onClick={() => navigate("/salary-configuration")}
                        className="btn btn-secondary"
                    >
                        ⚙️ Salary Config
                    </button>
                    <button
                        onClick={() => navigate("/admin-dashboard")}
                        className="btn btn-secondary"
                    >
                        ← Dashboard
                    </button>
                </div>
            </div>

            {/* ================= CONTROLS & SUMMARY ================= */}
            <section className="dashboard-section grid-2">

                {/* Date Filters */}
                <div className="card">
                    <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Select Period</h3>
                    <div className="flex-gap" style={{ flexDirection: 'column' }}>
                        <div>
                            <label className="form-label">Month</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="form-control"
                            >
                                {monthNames.map((m, idx) => (
                                    <option key={idx} value={idx + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Year</label>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="form-control"
                                min="2020" max="2030"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid" style={{ marginBottom: 0 }}>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value">{summary.totalEmployees}</div>
                        <div className="stat-label">Processed</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value">₹{(summary.totalNet || 0).toLocaleString()}</div>
                        <div className="stat-label">Net Pay</div>
                    </div>
                    <div className="stat-card stat-success">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{summary.paidCount}</div>
                        <div className="stat-label">Paid</div>
                    </div>
                    <div className="stat-card stat-warning">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-value">{summary.pendingCount}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                </div>
            </section>

            {/* ================= EMPLOYEE LIST ================= */}
            <section className="dashboard-section">
                <h2 className="section-title">Employee Payrolls for {monthNames[selectedMonth - 1]} {selectedYear}</h2>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                        <div style={{ fontSize: "2rem" }}>⏳</div>
                        <p>Loading payroll data...</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="payroll-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Attendance</th>
                                    <th>Gross Salary</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Status</th>
                                    <th>Payslip</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeeData.map((data) => {
                                    const isProcessing = processingId === data._id || (data.payroll && processingId === data.payroll._id);
                                    const hasPayroll = !!data.payroll;

                                    return (
                                        <tr key={data._id}>
                                            <td>
                                                <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{data.fullName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{data.domain}</div>
                                            </td>

                                            <td>
                                                {hasPayroll ? (
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <div style={{ color: '#f1f5f9', fontWeight: 'bold' }}>
                                                            {data.payroll.attendanceData.presentDays} / {data.payroll.attendanceData.totalWorkingDays}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem' }}>
                                                            {data.payroll.attendanceData.approvedLeaves > 0 &&
                                                                <span style={{ color: '#3b82f6' }}>+{data.payroll.attendanceData.approvedLeaves} Leave </span>}
                                                            {data.payroll.attendanceData.absentDays > 0 &&
                                                                <span style={{ color: '#f87171' }}>-{data.payroll.attendanceData.absentDays} Abs </span>}
                                                        </div>
                                                    </div>
                                                ) : "—"}
                                            </td>

                                            <td>
                                                {hasPayroll ? `₹${data.payroll.grossSalary.toFixed(2)}` : "—"}
                                            </td>

                                            <td>
                                                {hasPayroll ? `₹${data.payroll.totalDeductions.toFixed(2)}` : "—"}
                                            </td>

                                            <td>
                                                {hasPayroll ? (
                                                    <strong style={{ color: '#34d399' }}>₹{data.payroll.netSalary.toFixed(2)}</strong>
                                                ) : "—"}
                                            </td>

                                            <td>
                                                {!hasPayroll ? (
                                                    <span className="badge badge-na">Not Calculated</span>
                                                ) : (
                                                    <span className={`badge ${data.payroll.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}`}>
                                                        {data.payroll.paymentStatus}
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {hasPayroll && data.payroll.payslipGenerated ? (
                                                    <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>Generated ✅</span>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>—</span>
                                                )}
                                            </td>

                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button
                                                        onClick={() => handleCalculate(data._id)}
                                                        disabled={isProcessing || (hasPayroll && data.payroll.paymentStatus === 'Paid')}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        {isProcessing ? "..." : (hasPayroll ? "Recalculate" : "Calculate")}
                                                    </button>

                                                    {hasPayroll && data.payroll.paymentStatus !== 'Paid' && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(data.payroll)}
                                                                className="btn btn-sm btn-secondary"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkPaid(data.payroll._id)}
                                                                disabled={isProcessing}
                                                                className="btn btn-sm btn-success"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        </>
                                                    )}

                                                    {hasPayroll && (
                                                        <button
                                                            onClick={() => handleGeneratePayslip(data.payroll._id)}
                                                            disabled={isProcessing}
                                                            className="btn btn-sm btn-secondary"
                                                        >
                                                            {data.payroll.payslipGenerated ? "Regenerate" : "Generate Slip"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {employeeData.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                            No employees found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* EDIT MODAL */}
            {editModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="section-title">Adjust Payroll</h2>
                        <form onSubmit={handleUpdatePayroll}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Bonus (₹)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={editFormData.bonus}
                                    onChange={e => setEditFormData({ ...editFormData, bonus: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Late Deduction (₹)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={editFormData.deductions.lateDeduction}
                                    onChange={e => setEditFormData({
                                        ...editFormData,
                                        deductions: { ...editFormData.deductions, lateDeduction: e.target.value }
                                    })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Other Deductions (₹)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={editFormData.deductions.other}
                                    onChange={e => setEditFormData({
                                        ...editFormData,
                                        deductions: { ...editFormData.deductions, other: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-success">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollProcessing;
