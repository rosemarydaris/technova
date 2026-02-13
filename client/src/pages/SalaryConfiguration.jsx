import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Payroll.css";


const SalaryConfiguration = () => {
  const [salaryConfigs, setSalaryConfigs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: "",
    baseSalary: 0,
    allowances: {
      hra: 0,
      da: 0,
      ta: 0,
      medical: 0,
      other: 0
    },
    deductions: {
      pf: 0,
      esi: 0,
      tax: 0,
      professionalTax: 0
    },
    overtimeEnabled: false,
    overtimeRate: 0,
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      accountHolderName: ""
    },
    employmentType: "Full-time",
    domain: "",
    panNumber: "",
    esiNumber: "",
    pfNumber: "",
    salaryDay: 1
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSalaryConfigs();
    fetchEmployees();
  }, [token, navigate]);

  // ================= FETCH SALARY CONFIGS =================
  const fetchSalaryConfigs = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/salary-config/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalaryConfigs(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ================= FETCH EMPLOYEES =================
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/employees/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filtered = res.data.filter(emp => emp.email !== "admin@technova.com" && !emp.isAdmin);
      setEmployees(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode && selectedConfig) {
        // Update existing config
        const res = await axios.put(
          `http://localhost:5001/api/salary-config/${selectedConfig._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(res.data.message);
      } else {
        // Create new config
        const res = await axios.post(
          "http://localhost:5001/api/salary-config",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(res.data.message);
      }

      setShowModal(false);
      resetForm();
      fetchSalaryConfigs();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setFormData({
      employeeId: "",
      baseSalary: 0,
      allowances: { hra: 0, da: 0, ta: 0, medical: 0, other: 0 },
      deductions: { pf: 0, esi: 0, tax: 0, professionalTax: 0 },
      overtimeEnabled: false,
      overtimeRate: 0,
      bankDetails: {
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        branchName: "",
        accountHolderName: ""
      },
      employmentType: "Full-time",
      domain: "",
      panNumber: "",
      esiNumber: "",
      pfNumber: "",
      salaryDay: 1
    });
    setIsEditMode(false);
    setSelectedConfig(null);
  };

  // ================= EDIT CONFIG =================
  const handleEdit = (config) => {
    setSelectedConfig(config);
    setFormData({
      employeeId: config.employeeId._id,
      baseSalary: config.baseSalary,
      allowances: config.allowances,
      deductions: config.deductions,
      overtimeEnabled: config.overtimeEnabled,
      overtimeRate: config.overtimeRate,
      bankDetails: config.bankDetails,
      employmentType: config.employmentType,
      domain: config.domain || "",
      panNumber: config.panNumber || "",
      esiNumber: config.esiNumber || "",
      pfNumber: config.pfNumber || "",
      salaryDay: config.salaryDay
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  // ================= DELETE CONFIG =================
  const handleDelete = async (configId) => {
    if (!window.confirm("Are you sure you want to delete this salary configuration?")) {
      return;
    }

    try {
      const res = await axios.delete(
        `http://localhost:5001/api/salary-config/${configId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      fetchSalaryConfigs();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // ================= CALCULATE TOTALS =================
  const calculateTotals = () => {
    const totalAllowances =
      Number(formData.allowances.hra || 0) +
      Number(formData.allowances.da || 0) +
      Number(formData.allowances.ta || 0) +
      Number(formData.allowances.medical || 0) +
      Number(formData.allowances.other || 0);

    const totalDeductions =
      Number(formData.deductions.pf || 0) +
      Number(formData.deductions.esi || 0) +
      Number(formData.deductions.tax || 0) +
      Number(formData.deductions.professionalTax || 0);

    const grossSalary = Number(formData.baseSalary || 0) + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    return { totalAllowances, totalDeductions, grossSalary, netSalary };
  };

  const totals = calculateTotals();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">⚙️ Salary Configuration</h1>
        <div className="flex-gap">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-success"
          >
            + Add Salary Config
          </button>
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* ================= SALARY CONFIGS LIST ================= */}
      <section className="dashboard-section">
        <h2 className="section-title">Employee Salary Configurations</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
            <p>Loading...</p>
          </div>
        ) : salaryConfigs.length === 0 ? (
          <div className="payroll-empty">
            <p>No salary configurations found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Domain</th>
                  <th>Base Salary</th>
                  <th>Gross Salary</th>
                  <th>Net Salary</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaryConfigs.map((config) => {
                  const totalAllowances =
                    (config.allowances.hra || 0) +
                    (config.allowances.da || 0) +
                    (config.allowances.ta || 0) +
                    (config.allowances.medical || 0) +
                    (config.allowances.other || 0);

                  const totalDeductions =
                    (config.deductions.pf || 0) +
                    (config.deductions.esi || 0) +
                    (config.deductions.tax || 0) +
                    (config.deductions.professionalTax || 0);

                  const grossSalary = config.baseSalary + totalAllowances;
                  const netSalary = grossSalary - totalDeductions;

                  return (
                    <tr key={config._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#f1f5f9" }}>
                          {config.employeeId?.fullName || "N/A"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          {config.employeeId?.email}
                        </div>
                      </td>
                      <td>{config.domain || "N/A"}</td>
                      <td>₹{config.baseSalary.toFixed(2)}</td>
                      <td>₹{grossSalary.toFixed(2)}</td>
                      <td>
                        <strong style={{ color: "#34d399" }}>₹{netSalary.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className="badge badge-na">{config.employmentType}</span>
                      </td>
                      <td>
                        <div className="flex-gap" style={{ gap: "0.5rem" }}>
                          <button
                            onClick={() => handleEdit(config)}
                            className="btn btn-sm btn-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(config._id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ================= ADD/EDIT MODAL ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
              {isEditMode ? "Edit" : "Add"} Salary Configuration
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Employee Selection */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Employee *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="form-control"
                  required
                  disabled={isEditMode}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.domain})
                    </option>
                  ))}
                </select>
              </div>

              {/* Employment Details */}
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#f1f5f9", borderBottom: '1px solid rgba(148,163,184,0.1)', paddingBottom: '0.5rem' }}>
                Employment Details
              </h3>
              <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <label className="form-label">Domain</label>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="form-control"
                    required
                  >
                    <option value="">Select Domain</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager / Team Lead</option>
                    <option value="Developer">Developer</option>
                    <option value="Tester">Tester</option>
                    <option value="Designer">Designer</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="form-control"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
              </div>

              {/* Salary Details */}
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#f1f5f9", borderBottom: '1px solid rgba(148,163,184,0.1)', paddingBottom: '0.5rem' }}>
                Salary Details
              </h3>
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Base Salary (₹) *</label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  className="form-control"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Allowances */}
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>
                Allowances
              </h4>
              <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <label className="form-label">HRA (₹)</label>
                  <input
                    type="number"
                    value={formData.allowances.hra}
                    onChange={(e) => setFormData({
                      ...formData,
                      allowances: { ...formData.allowances, hra: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="form-label">DA (₹)</label>
                  <input
                    type="number"
                    value={formData.allowances.da}
                    onChange={(e) => setFormData({
                      ...formData,
                      allowances: { ...formData.allowances, da: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="form-label">Transport Allowance (₹)</label>
                  <input
                    type="number"
                    value={formData.allowances.ta}
                    onChange={(e) => setFormData({
                      ...formData,
                      allowances: { ...formData.allowances, ta: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="form-label">Medical Allowance (₹)</label>
                  <input
                    type="number"
                    value={formData.allowances.medical}
                    onChange={(e) => setFormData({
                      ...formData,
                      allowances: { ...formData.allowances, medical: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="form-label">Other Allowances (₹)</label>
                  <input
                    type="number"
                    value={formData.allowances.other}
                    onChange={(e) => setFormData({
                      ...formData,
                      allowances: { ...formData.allowances, other: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Deductions */}
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>
                Deductions
              </h4>
              <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <label className="form-label">PF (₹)</label>
                  <input
                    type="number"
                    value={formData.deductions.pf}
                    onChange={(e) => setFormData({
                      ...formData,
                      deductions: { ...formData.deductions, pf: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="form-label">ESI (₹)</label>
                  <input
                    type="number"
                    value={formData.deductions.esi}
                    onChange={(e) => setFormData({
                      ...formData,
                      deductions: { ...formData.deductions, esi: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="form-label">Income Tax (₹)</label>
                  <input
                    type="number"
                    value={formData.deductions.tax}
                    onChange={(e) => setFormData({
                      ...formData,
                      deductions: { ...formData.deductions, tax: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="form-label">Professional Tax (₹)</label>
                  <input
                    type="number"
                    value={formData.deductions.professionalTax}
                    onChange={(e) => setFormData({
                      ...formData,
                      deductions: { ...formData.deductions, professionalTax: e.target.value }
                    })}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Overtime */}
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>
                Overtime Settings
              </h4>
              <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.overtimeEnabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        overtimeEnabled: e.target.checked
                      })}
                      style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                    />
                    Overtime Enabled
                  </label>
                </div>
                <div>
                  <label className="form-label">Overtime Rate (₹/hour)</label>
                  <input
                    type="number"
                    value={formData.overtimeRate}
                    onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                    className="form-control"
                    min="0"
                    step="0.01"
                    disabled={!formData.overtimeEnabled}
                  />
                </div>
              </div>

              {/* Summary */}
              <div style={{
                marginTop: "1.5rem",
                padding: "1.5rem",
                backgroundColor: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "12px"
              }}>
                <h4 style={{ marginBottom: "1rem", color: "#f1f5f9" }}>Estimated Monthly Salary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Base Salary</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>₹{Number(formData.baseSalary || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Allowances</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#60a5fa' }}>+ ₹{totals.totalAllowances.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Deductions</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f87171' }}>- ₹{totals.totalDeductions.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Net Pay</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#34d399' }}>₹{totals.netSalary.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex-gap" style={{ marginTop: "2rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditMode ? "Update" : "Create"} Configuration
                </button>
              </div>
            </form>
          </div>
        </div >
      )}
    </div >
  );
};

export default SalaryConfiguration;