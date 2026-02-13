import React, { useState } from 'react';
import axios from 'axios';

const LeaveApplicationModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            await axios.post(
                'http://localhost:5001/api/leave/apply',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Leave application submitted successfully');
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit leave application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        .modal-content {
          background: #1e293b;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          width: 90%;
          max-width: 500px;
          color: #f1f5f9;
        }
        .modal-title {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #94a3b8;
          font-size: 0.9rem;
        }
        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 0.95rem;
        }
        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #cbd5e1;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-submit {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
      `}</style>
            <div className="modal-content">
                <h2 className="modal-title">Apply for Leave</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Leave Type</label>
                        <select
                            name="leaveType"
                            value={formData.leaveType}
                            onChange={handleChange}
                            className="form-select"
                            required
                        >
                            <option value="">Select Type</option>
                            <option value="Sick">Sick Leave</option>
                            <option value="Casual">Casual Leave</option>
                            <option value="Annual">Annual Leave</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Unpaid">Unpaid Leave</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Reason</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            className="form-textarea"
                            placeholder="Please provide a reason..."
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveApplicationModal;
