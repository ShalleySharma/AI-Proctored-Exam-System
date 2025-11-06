import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../utils/auth';
import './TeacherLogin.css';

function TeacherLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for the field being changed
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear all errors before validation
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    const payload = new FormData();
    payload.append('email', formData.email);
    payload.append('password', formData.password);

    try {
      const res = await authService.login('/api/auth/teacher-login', payload);
      alert(res.data.msg);
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'Login failed';
      const lowerMsg = errorMsg.toLowerCase();
      if (lowerMsg.includes('password') || lowerMsg.includes('invalid') || lowerMsg.includes('wrong') || lowerMsg.includes('incorrect')) {
        setErrors({ password: 'Password is not correct' });
      } else if (lowerMsg.includes('email') || lowerMsg.includes('user') || lowerMsg.includes('not found') || lowerMsg.includes('not registered') || lowerMsg.includes('does not exist')) {
        setErrors({ email: 'Email is not registered' });
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="teacher-login-container">
      <div className="teacher-login-card">
        <div className="teacher-login-left">
          <div style={{ textAlign: 'center' }}>
            <img src="/images/password.jpg" alt="Teacher Login" />
            <h3>Welcome Back Teacher!</h3>
            <p>Login to manage your exams and students.</p>
          </div>
        </div>
        <div className="teacher-login-right">
          <h2 className="teacher-login-title">Teacher Login</h2>
          <form className="teacher-login-form" onSubmit={handleSubmit}>
            <div className="teacher-login-input-group">
              <div className="teacher-login-input-with-icon">
                <i className="bi bi-envelope teacher-login-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className={`teacher-login-input ${errors.email ? 'error' : ''}`}
                />
              </div>
              {errors.email && <span className="teacher-login-error">{errors.email}</span>}
            </div>
            <div className="teacher-login-input-group">
              <div className="teacher-login-input-with-icon">
                <i className="bi bi-lock teacher-login-input-icon"></i>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className={`teacher-login-input ${errors.password ? 'error' : ''}`}
                />
                <i className="bi bi-eye-slash teacher-login-password-toggle" onClick={() => {
                  const input = document.querySelector('input[name="password"]');
                  input.type = input.type === 'password' ? 'text' : 'password';
                  const icon = document.querySelector('.teacher-login-password-toggle');
                  icon.className = input.type === 'password' ? 'bi bi-eye-slash teacher-login-password-toggle' : 'bi bi-eye teacher-login-password-toggle';
                }}></i>
              </div>
              {errors.password && <span className="teacher-login-error">{errors.password}</span>}
            </div>
            <button
              type="submit"
              className="teacher-login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="bi bi-arrow-repeat me-2 spinning"></i>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login as Teacher
                </>
              )}
            </button>
          </form>
          <p className="teacher-login-footer">
            Don't have an account? <a href="/teacher-signup">Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeacherLogin;
