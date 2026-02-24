import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "primary" }) => {
    if (!isOpen) return null;

    const getConfirmButtonStyle = () => {
        if (type === "success") {
            return {
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            };
        }
        return {
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
        };
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
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease-out;
                }
                .modal-content {
                    background: #1e293b;
                    padding: 2rem;
                    border-radius: 20px;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    width: 90%;
                    max-width: 400px;
                    color: #f1f5f9;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    transform: scale(1);
                    animation: slideUp 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-title {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .modal-message {
                    color: #94a3b8;
                    font-size: 1rem;
                    line-height: 1.5;
                    margin-bottom: 2rem;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                .btn-modal {
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.95rem;
                    border: none;
                }
                .btn-cancel {
                    background: rgba(148, 163, 184, 0.1);
                    color: #cbd5e1;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                }
                .btn-cancel:hover {
                    background: rgba(148, 163, 184, 0.2);
                    transform: translateY(-2px);
                }
                .btn-confirm {
                    color: white;
                }
                .btn-confirm:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
            `}</style>
            <div className="modal-content">
                <div className="modal-title">
                    <span>{title}</span>
                </div>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="btn-modal btn-cancel">
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="btn-modal btn-confirm"
                        style={getConfirmButtonStyle()}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
