import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GetStarted.css';

function Login() {
  const navigate = useNavigate();

  const handleStudentLogin = () => {
    navigate('/student-signin');
  };

  const handleTeacherLogin = () => {
    navigate('/teacher-signin');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <div style={{ textAlign: 'center' }}>
            <img src="/images/role.jpg" alt="Student Teacher image" />
            <h3>Welcome to Our Platform</h3>
            <p>Choose your role to continue</p>
          </div>
        </div>
        <div className="login-right">
          <h2 className="login-title">Get Started</h2>
          <div className="role-buttons">
            <button
              onClick={handleStudentLogin}
              className="role-btn student-btn"
            >
              <i className="bi bi-mortarboard-fill"></i>
              I am a Student
            </button>
            <button
              onClick={handleTeacherLogin}
              className="role-btn teacher-btn"
            >
              <i className="bi bi-person-fill"></i>
              I am a Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
