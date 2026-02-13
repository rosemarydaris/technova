import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import "./Payroll.css";

const MyPayslips = () => {
  const [salaryConfig, setSalaryConfig] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMyPayrolls();
    fetchMySalaryConfig();
  }, [token, navigate]);

  const fetchMyPayrolls = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5001/api/payroll/my-payroll", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayrolls(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySalaryConfig = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/salary-config/my-config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalaryConfig(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadExcel = (payroll) => {
    const data = [
      ["TECHNOVA SOFTWARES - PAYSLIP"],
      [`Period: ${new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`],
      [],
      ["Employee Summary"],
      ["Net Monthly Pay", payroll.netSalary],
      [],
      ["Attendance Summary"],
      ["Present Days", payroll.attendanceData?.presentDays || 0],
      ["Absent Days", payroll.attendanceData?.absentDays || 0],
      ["Late Marks", payroll.attendanceData?.lateDays || 0],
      [],
      ["Earnings", "Amount"],
      ["Base Salary", payroll.baseSalary],
      ["Allowances", Object.values(payroll.allowances || {}).reduce((a, b) => a + Number(b), 0)],
      ["Overtime Pay", payroll.overtimePay || 0],
      ["Bonus", payroll.bonus || 0],
      ["Gross Earnings", payroll.grossSalary],
      [],
      ["Deductions", "Amount"],
      ["Provident Fund", payroll.deductions?.pf || 0],
      ["Income Tax", payroll.deductions?.tax || 0],
      ["Professional Tax", payroll.deductions?.professionalTax || 0],
      ["Total Deductions", payroll.totalDeductions],
      [],
      ["Net Salary", payroll.netSalary]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payslip");
    XLSX.writeFile(wb, `Payslip_${payroll.month}_${payroll.year}.xlsx`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">💼 My Payslips</h1>
          <p className="page-subtitle">View your salary details and history</p>
        </div>
        <button
          onClick={() => navigate("/employee-dashboard")}
          className="btn btn-secondary"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Salary Configuration Summary */}
      {salaryConfig && (
        <section className="dashboard-section">
          <h2 className="section-title">My Salary Configuration</h2>
          <div className="card">
            <div className="grid-2">
              <div>
                <h3 style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Basic & Allowances</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <span style={{ color: '#cbd5e1' }}>Base Salary</span>
                    <strong style={{ color: '#f1f5f9' }}>₹{salaryConfig.baseSalary.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <span style={{ color: '#60a5fa' }}>Total Allowances</span>
                    <strong style={{ color: '#60a5fa' }}>+ ₹{
                      ((salaryConfig.allowances.hra || 0) +
                        (salaryConfig.allowances.da || 0) +
                        (salaryConfig.allowances.ta || 0) +
                        (salaryConfig.allowances.medical || 0) +
                        (salaryConfig.allowances.other || 0)).toFixed(2)
                    }</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>Gross Salary</span>
                    <strong style={{ fontSize: '1.1rem' }}>₹{
                      (salaryConfig.baseSalary +
                        (salaryConfig.allowances.hra || 0) +
                        (salaryConfig.allowances.da || 0) +
                        (salaryConfig.allowances.ta || 0) +
                        (salaryConfig.allowances.medical || 0) +
                        (salaryConfig.allowances.other || 0)).toFixed(2)
                    }</strong>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions & Net</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <span style={{ color: '#f87171' }}>Total Deductions</span>
                    <strong style={{ color: '#f87171' }}>- ₹{
                      ((salaryConfig.deductions.pf || 0) +
                        (salaryConfig.deductions.esi || 0) +
                        (salaryConfig.deductions.tax || 0) +
                        (salaryConfig.deductions.professionalTax || 0)).toFixed(2)
                    }</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: 'auto' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#34d399' }}>Net Monthly Pay</span>
                    <strong style={{ fontSize: '1.5rem', color: '#34d399' }}>₹{
                      ((salaryConfig.baseSalary +
                        (salaryConfig.allowances.hra || 0) +
                        (salaryConfig.allowances.da || 0) +
                        (salaryConfig.allowances.ta || 0) +
                        (salaryConfig.allowances.medical || 0) +
                        (salaryConfig.allowances.other || 0)) -
                        ((salaryConfig.deductions.pf || 0) +
                          (salaryConfig.deductions.esi || 0) +
                          (salaryConfig.deductions.tax || 0) +
                          (salaryConfig.deductions.professionalTax || 0))).toFixed(2)
                    }</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <h2 className="section-title">Payroll History</h2>
        {loading ? (
          <div className="payroll-empty">Loading payroll records...</div>
        ) : payrolls.length === 0 ? (
          <div className="payroll-empty">
            <p>No payroll records found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Payslip</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr
                    key={payroll._id}
                    onClick={() => setSelectedPayroll(payroll)}
                    style={{ cursor: "pointer" }}
                    title="Click to view details"
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: "#f1f5f9" }}>
                        {new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </div>
                    </td>
                    <td>₹{payroll.grossSalary.toFixed(2)}</td>
                    <td style={{ color: "#f87171" }}>-₹{payroll.totalDeductions.toFixed(2)}</td>
                    <td>
                      <strong style={{ color: "#34d399" }}>₹{payroll.netSalary.toFixed(2)}</strong>
                    </td>
                    <td>
                      {payroll.payslipGenerated ? (
                        <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>Available</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Not Generated</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayroll(payroll);
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selectedPayroll && (
        <div className="modal-overlay" onClick={() => setSelectedPayroll(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(148,163,184,0.1)', paddingBottom: '1rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Payslip Details</h2>
              <span style={{ fontSize: '1rem', color: '#94a3b8' }}>
                {new Date(selectedPayroll.year, selectedPayroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Status</span>
                <span className={`badge ${selectedPayroll.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}`}>
                  {selectedPayroll.paymentStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Transaction ID</span>
                <span style={{ color: '#f1f5f9' }}>{selectedPayroll.transactionId || "—"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Attendance (P/A/L)</span>
                <span style={{ color: '#f1f5f9' }}>
                  {selectedPayroll.attendanceData?.presentDays || 0} / {selectedPayroll.attendanceData?.absentDays || 0} / {selectedPayroll.attendanceData?.lateDays || 0}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', color: '#f1f5f9', marginTop: '1rem' }}>Earnings</h3>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px', display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#cbd5e1' }}>Base Salary</span>
                  <span style={{ color: '#f1f5f9' }}>₹{selectedPayroll.baseSalary.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#cbd5e1' }}>Allowances</span>
                  <span style={{ color: '#60a5fa' }}>+ ₹{Object.values(selectedPayroll.allowances || {}).reduce((a, b) => a + Number(b), 0).toFixed(2)}</span>
                </div>
                {selectedPayroll.overtimePay > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>Overtime</span>
                    <span style={{ color: '#fbbf24' }}>+ ₹{selectedPayroll.overtimePay.toFixed(2)}</span>
                  </div>
                )}
                {selectedPayroll.bonus > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>Bonus</span>
                    <span style={{ color: '#fbbf24' }}>+ ₹{selectedPayroll.bonus.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: '0.5rem', marginTop: '0.25rem', fontWeight: '600' }}>
                  <span style={{ color: '#f1f5f9' }}>Gross Earnings</span>
                  <span style={{ color: '#f1f5f9' }}>₹{selectedPayroll.grossSalary.toFixed(2)}</span>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', color: '#f1f5f9', marginTop: '1rem' }}>Deductions</h3>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px', display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#cbd5e1' }}>Provident Fund</span>
                  <span style={{ color: '#f1f5f9' }}>₹{(selectedPayroll.deductions?.pf || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#cbd5e1' }}>Income Tax</span>
                  <span style={{ color: '#f1f5f9' }}>₹{(selectedPayroll.deductions?.tax || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#cbd5e1' }}>Professional Tax</span>
                  <span style={{ color: '#f1f5f9' }}>₹{(selectedPayroll.deductions?.professionalTax || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: '0.5rem', marginTop: '0.25rem', fontWeight: '600', color: '#f87171' }}>
                  <span>Total Deductions</span>
                  <span>- ₹{selectedPayroll.totalDeductions.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f1f5f9' }}>Net Pay</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34d399' }}>₹{selectedPayroll.netSalary.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {selectedPayroll.payslipGenerated && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadExcel(selectedPayroll)}
                >
                  Download Excel
                </button>
              )}
              <button
                onClick={() => setSelectedPayroll(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPayslips;