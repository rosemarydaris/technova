// const Register = () => { This component will show the Register page UI.

import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  //   const [errors, setErrors] = useState({});

  // Stores form validation errors

  // Empty object {} → no errors initially
  const [isSubmitting, setIsSubmitting] = useState(false);   // To disable submit button during submission
  const navigate = useNavigate(); // For navigation after successful registration
  const { setUser } = useUser();

  const [formData, setFormData] = useState({ // Form data state
    fullName: '', // Full name field
    email: '',
    company: '',
    phone: '',
    domain: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false, // Terms of Service checkbox
    profilePic: null

  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      //Checks if full name is empty

      // If empty → error message added
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.domain) {
      newErrors.domain = 'Please select your domain';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

// Removed agreeTerms validation as it's currently commented out in the UI

    setErrors(newErrors); // Update errors state
    return Object.keys(newErrors).length === 0; /// Return true if no errors
  };

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) { // 5MB in bytes
        alert('File size must be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, profilePic: file }));

      // Create preview
      const reader = new FileReader(); // FileReader to read file
      reader.onloadend = () => {// On load end
        setPreviewUrl(reader.result);// Set preview URL
      };
      reader.readAsDataURL(file);// Read file as data URL
    } else {
      alert('Please select a valid image file (PNG, JPG, JPEG, GIF, WEBP)');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation();// Stop propagation
    if (e.type === "dragenter" || e.type === "dragover") { // 👉 Means:user is dragging file on the box
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => { //Runs when user releases mouse and drops file
    e.preventDefault(); e.stopPropagation(); //Prevents browser from opening the file
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) { // Get dropped file
      handleFileChange(e.dataTransfer.files[0]); //Send file for validation & preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); /// Prevents browser from refreshing

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true); //Disables submit button

    try {
      // Create FormData for file upload
      const data = new FormData(); // FormData is used when:sending files , sending form fields together




      data.append('fullName', formData.fullName);
      data.append('email', formData.email);
      data.append('company', formData.company);
      data.append('phone', formData.phone);
      data.append('password', formData.password);
      data.append('domain', formData.domain);

      if (formData.profilePic) { //Adds image only if user uploaded one
        data.append('profilePic', formData.profilePic);
      }

      const response = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Registration successful!");

        // Auto-login: Update UserContext
        setUser({
          token: result.token,
          name: result.name,
          email: result.email,
          domain: result.domain,
        });

        // Navigate based on domain (if admin is assigned during registration)
        if (result.domain === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      } else {
        alert(result.message || "Registration failed");
      }
    } catch (error) {
      alert("Registration failed. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow-x: hidden;
        }

        .register-container {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #0a1628 0%, #060d19 100%);
          position: relative;
          overflow: hidden;
        }

        .register-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(33,150,243,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          opacity: 0.3;
        }

        .register-left {
          flex: 1;
          background: rgba(26, 41, 66, 0.5);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          z-index: 1;
          border-right: 1px solid rgba(33, 150, 243, 0.1);
        }

        .register-form-wrapper {
          max-width: 500px;
          width: 100%;
          animation: slideInLeft 0.8s ease;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .register-form {
          background: rgba(26, 41, 66, 0.8);
          backdrop-filter: blur(10px);
          padding: 3rem;
          border-radius: 20px;
          border: 1px solid rgba(33, 150, 243, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .form-title {
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .form-subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        .upload-section {
          margin-bottom: 1.5rem;
        }

        .upload-area {
          border: 2px dashed rgba(33, 150, 243, 0.4);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .upload-area:hover,
        .upload-area.drag-active {
          border-color: #2196F3;
          background: rgba(33, 150, 243, 0.08);
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .upload-text {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .upload-hint {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
        }

        .file-input {
          display: none;
        }

        .preview-container {
          margin-top: 1rem;
          display: flex;
          justify-content: center;
        }

        .preview-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #2196F3;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .remove-image {
          margin-top: 0.5rem;
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
          border: 1px solid rgba(244, 67, 54, 0.4);
          padding: 0.4rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }

        .remove-image:hover {
          background: rgba(244, 67, 54, 0.3);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          font-size: 1.2rem;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 0.9rem 1rem 0.9rem 3rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(33, 150, 243, 0.3);
          border-radius: 10px;
          color: #fff;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          outline: none;
        }

        .form-input.error {
          border-color: #f44336;
        }

        .form-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        select.form-input {
          cursor: pointer;
          appearance: none;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="rgba(255,255,255,0.7)" d="M6 9L1 4h10z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }

        select.form-input option {
          background: #0a1628;
          color: #fff;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0;
          outline: none;
        }

        .error-message {
          color: #f44336;
          font-size: 0.85rem;
          margin-top: 0.25rem;
          display: block;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          margin-top: 0.2rem;
          flex-shrink: 0;
        }

        .checkbox-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          cursor: pointer;
        }

        .checkbox-label span {
          color: #2196F3;
          text-decoration: underline;
          cursor: pointer;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-link {
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .login-link span {
          color: #2196F3;
          cursor: pointer;
          text-decoration: underline;
        }

        .login-link span:hover {
          color: #42A5F5;
        }

        @media (max-width: 968px) {
          .register-container {
            flex-direction: column-reverse;
          }

          .register-left {
            border-right: none;
            border-bottom: 1px solid rgba(33, 150, 243, 0.1);
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .register-form {
            padding: 2rem 1.5rem;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .register-left {
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="register-container">
        <div className="register-left">
          <div className="register-form-wrapper">
            <form className="register-form" onSubmit={handleSubmit}>
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Start your 14-day free trial today</p>

              <div className="upload-section">
                <label className="form-label">Profile Picture (Optional)</label>
                <div
                  className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('profilePicInput').click()}
                >
                  {!previewUrl ? (
                    <>
                      <div className="upload-icon">📸</div>
                      <div className="upload-text">Drag & drop or click to upload</div>
                      <div className="upload-hint">PNG, JPG up to 5MB</div>
                    </>
                  ) : (
                    <div className="preview-container">
                      <img src={previewUrl} alt="Preview" className="preview-image" />
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="remove-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, profilePic: null }));
                        setPreviewUrl(null);
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                <input
                  id="profilePicInput"
                  type="file"
                  className="file-input"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      name="fullName"
                      className={`form-input ${errors.fullName ? 'error' : ''}`}
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      name="email"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🏢</span>
                    <input
                      type="text"
                      name="company"
                      className={`form-input ${errors.company ? 'error' : ''}`}
                      placeholder="Your Company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.company && <span className="error-message">{errors.company}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📱</span>
                    <input
                      type="tel"
                      name="phone"
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Domain / Department</label>
                <div className="input-wrapper">
                  <span className="input-icon">🏷️</span>
                  <select
                    name="domain"
                    className={`form-input ${errors.domain ? 'error' : ''}`}
                    value={formData.domain}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your domain</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager / Team Lead</option>
                    <option value="Developer">Developer</option>
                    <option value="Tester">Tester</option>
                    <option value="Designer">Designer</option>
                  </select>
                </div>
                {errors.domain && <span className="error-message">{errors.domain}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔐</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              {/* <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  className="form-checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <label htmlFor="agreeTerms" className="checkbox-label">
                  I agree to the <span>Terms of Service</span> and <span>Privacy Policy</span>
                </label>
              </div>
              {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>} */}

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="login-link">
                Already have an account?{" "}
                <span onClick={() => navigate("/login")}>
                  Sign In
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;