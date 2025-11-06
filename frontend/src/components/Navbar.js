import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../utils/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isTeacher, setIsTeacher] = useState(!!authService.getTeacherId());
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setIsTeacher(!!authService.getTeacherId());
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('authChange', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => {
          if (res.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('teacherId');
            localStorage.removeItem('studentId');
            window.dispatchEvent(new Event('authChange'));
          } else if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          } else {
            return res.json();
          }
        })
        .then(data => {
          // Token is valid, no action needed
        })
        .catch(err => {
          console.error('Token verification failed:', err);
          // Do not log out on network or other errors
        });
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${darkMode ? 'navbar-light bg-light' : 'navbar-light'}`} style={{
      backgroundColor: darkMode ? '#f8f9fa' : '#FFFFFF',
      boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
      borderBottom: '1px solid rgba(0,168,90,0.1)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease'
    }}>
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold fs-3" to="/" style={{
          color: darkMode ? '#000' : '#00A85A',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.5px'
        }}>
          <i className="bi bi-shield-check me-2"></i>
          proctoAI
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          style={{
            backgroundColor: 'transparent',
            color: darkMode ? '#000' : '#333333'
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {isAuthenticated && (
              <li className="nav-item me-4">
                <Link className="nav-link fw-semibold" to={isTeacher ? "/dashboard" : "/student-dashboard"} style={{
                  color: darkMode ? '#000' : '#333333',
                  fontSize: '0.95rem',
                  transition: 'color 0.3s ease',
                  position: 'relative'
                }} onMouseEnter={(e) => e.target.style.color = '#00A85A'} onMouseLeave={(e) => e.target.style.color = darkMode ? '#000' : '#333333'}>
                  Dashboard
                </Link>
              </li>
            )}
            <li className="nav-item me-4">
              <a className="nav-link fw-semibold" href="#about" style={{
                color: darkMode ? '#000' : '#333333',
                fontSize: '0.95rem',
                transition: 'color 0.3s ease'
              }} onMouseEnter={(e) => e.target.style.color = '#00A85A'} onMouseLeave={(e) => e.target.style.color = darkMode ? '#000' : '#333333'}>
                About
              </a>
            </li>
            {isAuthenticated ? (
              <li className="nav-item me-4">
                <Link className="nav-link fw-semibold" to={isTeacher ? "/teacher-profile" : "/student-profile"} style={{
                  color: darkMode ? '#000' : '#333333',
                  fontSize: '0.95rem',
                  transition: 'color 0.3s ease'
                }} onMouseEnter={(e) => e.target.style.color = '#00A85A'} onMouseLeave={(e) => e.target.style.color = darkMode ? '#000' : '#333333'}>
                  Profile
                </Link>
              </li>
            ) : (
              <li className="nav-item me-4">
                <Link className="nav-link fw-semibold" to="/login" style={{
                  color: darkMode ? '#000' : '#333333',
                  fontSize: '0.95rem',
                  transition: 'color 0.3s ease',
                  position: 'relative'
                }} onMouseEnter={(e) => e.target.style.color = '#00A85A'} onMouseLeave={(e) => e.target.style.color = darkMode ? '#000' : '#333333'}>
                  Get Started
                </Link>
              </li>
            )}
            <li className="nav-item me-4">
              <button className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold" onClick={toggleDarkMode} style={{
                borderColor: darkMode ? '#dee2e6' : '#00A85A',
                color: darkMode ? '#6c757d' : '#00A85A',
                transition: 'all 0.3s ease'
              }}>
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </li>
            {isAuthenticated && (
              <li className="nav-item">
                <button className="btn btn-danger btn-sm px-3 py-2 fw-semibold" onClick={() => {
                  authService.logout();
                  navigate('/');
                }} style={{
                  backgroundColor: '#dc3545',
                  borderColor: '#dc3545',
                  color: '#ffffff',
                  transition: 'all 0.3s ease'
                }} onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#6c757d';
                  e.target.style.borderColor = '#6c757d';
                }} onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#dc3545';
                  e.target.style.borderColor = '#dc3545';
                }}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
