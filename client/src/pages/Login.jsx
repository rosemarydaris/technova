
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext"; // adjust path if needed

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email: formData.email,
        password: formData.password
      });

      const { token, name, domain } = res.data;

      setUser({
        token,
        email: formData.email,
        name,
        domain
      });


      alert("Login successful");

      // Redirect based on domain
      if (domain === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/employee-dashboard");
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
      alert(errorMessage);
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

  const handleForgotPassword = () => {
    alert("Password reset functionality coming soon!");
    // In production, navigate to password reset page
    // navigate("/forgot-password");
  };

  const handleSocialLogin = (provider) => {
    alert(`${provider} login functionality coming soon!`);
    // In production, implement OAuth flow
  };

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow-x: hidden; }

        .login-container { min-height: 100vh; display: flex; background: linear-gradient(135deg, #0a1628 0%, #060d19 100%); position: relative; overflow: hidden; }
        .login-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(33,150,243,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>'); opacity: 0.3; }

        .login-left { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 1; }
        .login-right { flex: 1; background: rgba(26, 41, 66, 0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 1; border-left: 1px solid rgba(33, 150, 243, 0.1); }

        .login-content { max-width: 450px; width: 100%; animation: slideInLeft 0.8s ease; }
        .login-form-wrapper { max-width: 450px; width: 100%; animation: slideInRight 0.8s ease; }

        .brand-logo { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #2196F3, #1976D2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; animation: fadeInDown 1s ease; }
        .login-title { font-size: 2.5rem; font-weight: 800; color: #e0e7ff; margin-bottom: 0.5rem; animation: fadeInUp 1s ease; }
        .login-subtitle { color: #94a3b8; font-size: 1.1rem; margin-bottom: 2rem; animation: fadeInUp 1.2s ease; }

        .feature-list { list-style: none; padding: 0; margin: 2rem 0; }
        .feature-item { display: flex; align-items: center; padding: 1rem; background: rgba(26, 41, 66, 0.5); border-radius: 12px; margin-bottom: 1rem; border: 1px solid rgba(33, 150, 243, 0.1); animation: fadeInUp 0.8s ease forwards; opacity: 0; transition: all 0.3s ease; }
        .feature-item:nth-child(1) { animation-delay: 0.2s; }
        .feature-item:nth-child(2) { animation-delay: 0.4s; }
        .feature-item:nth-child(3) { animation-delay: 0.6s; }
        .feature-item:hover { transform: translateX(10px); border-color: #2196F3; }
        .feature-icon { width: 50px; height: 50px; background: linear-gradient(135deg, #2196F3, #1976D2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 1rem; font-size: 1.5rem; transition: transform 0.3s ease; }
        .feature-item:hover .feature-icon { transform: rotate(10deg) scale(1.1); }
        .feature-text h4 { color: #e0e7ff; font-size: 1.1rem; margin-bottom: 0.25rem; }
        .feature-text p { color: #94a3b8; font-size: 0.9rem; margin: 0; }

        .login-form { background: rgba(26, 41, 66, 0.8); backdrop-filter: blur(10px); padding: 3rem; border-radius: 20px; border: 1px solid rgba(33, 150, 243, 0.2); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
        .form-title { font-size: 2rem; font-weight: 700; color: #e0e7ff; margin-bottom: 0.5rem; text-align: center; }
        .form-subtitle { color: #94a3b8; text-align: center; margin-bottom: 2rem; }
        .form-group { margin-bottom: 1.5rem; }
        .form-label { display: block; color: #e0e7ff; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem; }
        .input-wrapper { position: relative; }
        .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.1rem; }
        .form-input { width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; background: #060d19; border: 1px solid rgba(33, 150, 243, 0.2); border-radius: 10px; color: #e0e7ff; font-size: 1rem; transition: all 0.3s ease; }
        .form-input.error { border-color: #f44336; }
        .form-input:focus { outline: none; border-color: #2196F3; box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1); transform: translateY(-2px); }
        .form-input::placeholder { color: #64748b; }
        .password-toggle { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748b; cursor: pointer; font-size: 1.1rem; transition: color 0.3s ease; }
        .password-toggle:hover { color: #2196F3; }
        
        .error-message { color: #f44336; font-size: 0.85rem; margin-top: 0.25rem; display: block; }

        .form-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .checkbox-wrapper { display: flex; align-items: center; }
        .form-checkbox { width: 18px; height: 18px; margin-right: 0.5rem; cursor: pointer; accent-color: #2196F3; }
        .checkbox-label { color: #94a3b8; font-size: 0.9rem; cursor: pointer; }
        .forgot-link { color: #2196F3; text-decoration: none; font-size: 0.9rem; font-weight: 600; transition: color 0.3s ease; cursor: pointer; }
        .forgot-link:hover { color: #1976D2; }
        .submit-btn { width: 100%; padding: 1rem; background: linear-gradient(135deg, #2196F3, #1976D2); border: none; border-radius: 10px; color: white; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .submit-btn::before { content: ''; position: absolute; top: 50%; left: 50%; width: 0; height: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.3); transform: translate(-50%, -50%); transition: width 0.6s, height 0.6s; }
        .submit-btn:hover:not(:disabled)::before { width: 400px; height: 400px; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(33, 150, 243, 0.4); }

        .divider { display: flex; align-items: center; margin: 2rem 0; }
        .divider-line { flex: 1; height: 1px; background: rgba(255, 255, 255, 0.1); }
        .divider-text { padding: 0 1rem; color: #64748b; font-size: 0.9rem; }

        .social-login { display: flex; gap: 1rem; margin-bottom: 2rem; }
        .social-btn { flex: 1; padding: 0.875rem; background: rgba(26, 41, 66, 0.8); border: 1px solid rgba(33, 150, 243, 0.2); border-radius: 10px; color: #e0e7ff; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .social-btn:hover { border-color: #2196F3; transform: translateY(-2px); background: rgba(33, 150, 243, 0.1); }

        .register-link { text-align: center; color: #94a3b8; margin-top: 2rem; }
        .register-link span { color: #2196F3; font-weight: 600; cursor: pointer; transition: color 0.3s ease; }
        .register-link span:hover { color: #1976D2; }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 3rem; }
        .stat-card { text-align: center; padding: 1.5rem; background: rgba(26, 41, 66, 0.5); border-radius: 12px; border: 1px solid rgba(33, 150, 243, 0.1); animation: scaleIn 0.8s ease forwards; opacity: 0; }
        .stat-card:nth-child(1) { animation-delay: 0.8s; }
        .stat-card:nth-child(2) { animation-delay: 1s; }
        .stat-card:nth-child(3) { animation-delay: 1.2s; }
        .stat-number { font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #2196F3, #1976D2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: pulse 2s ease infinite; }
        .stat-label { color: #94a3b8; font-size: 0.85rem; margin-top: 0.5rem; }

        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

        @media (max-width: 968px) {
          .login-container { flex-direction: column; }
          .login-left { display: none; }
          .login-right { border-left: none; border-top: 1px solid rgba(33, 150, 243, 0.1); }
          .stats-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .login-form { padding: 2rem 1.5rem; }
          .form-title { font-size: 1.5rem; }
          .social-login { flex-direction: column; }
        }
      `}</style>

      <div className="login-container">
        <div className="login-left">
          <div className="login-content">
            <h1 className="brand-logo">TechNova Solutions</h1>
            <h2 className="login-title">Welcome Back!</h2>
            <p className="login-subtitle">
              Access your IT management dashboard and streamline your operations
            </p>

            <ul className="feature-list">
              <li className="feature-item">
                <div className="feature-icon">🚀</div>
                <div className="feature-text">
                  <h4>Asset Management</h4>
                  <p>Track all your IT assets in one place</p>
                </div>
              </li>
              <li className="feature-item">
                <div className="feature-icon">🎫</div>
                <div className="feature-text">
                  <h4>Help Desk System</h4>
                  <p>Resolve tickets faster and efficiently</p>
                </div>
              </li>
              <li className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h4>Real-time Analytics</h4>
                  <p>Get insights with powerful reports</p>
                </div>
              </li>
            </ul>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrapper">
            <form className="login-form" onSubmit={handleSubmit}>
              <h2 className="form-title">Sign In</h2>
              <p className="form-subtitle">Enter your credentials to access your account</p>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="your.email@company.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
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

              <div className="form-row">
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    className="form-checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <label htmlFor="rememberMe" className="checkbox-label">
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="register-link">
                Don't have an account?{" "}
                <span onClick={() => navigate("/register")}>Create Account</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;