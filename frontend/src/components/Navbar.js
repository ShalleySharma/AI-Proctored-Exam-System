import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [isOpen, setIsOpen] = useState(false);

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
            <li className="nav-item me-4">
              <Link className="nav-link fw-semibold" to="/dashboard" style={{
                color: darkMode ? '#000' : '#333333',
                fontSize: '0.95rem',
                transition: 'color 0.3s ease',
                position: 'relative'
              }} onMouseEnter={(e) => e.target.style.color = '#00A85A'} onMouseLeave={(e) => e.target.style.color = darkMode ? '#000' : '#333333'}>
                Dashboard
              </Link>
            </li>
            <li className="nav-item me-4">
              <a className="nav-link fw-semibold" href="#about" style={{
                color: darkMode ? '#000' : '#333333',
                fontSize: '0.95rem',
                transition: 'color 0.3s ease'
              }} onMouseEnter={(e) => e.target.style.color = '#00A85A'} onMouseLeave={(e) => e.target.style.color = darkMode ? '#000' : '#333333'}>
                About
              </a>
            </li>
            <li className="nav-item me-4">
              <Link className="nav-link fw-semibold" to="/profile" style={{
                color: darkMode ? '#000' : '#333333',
                fontSize: '0.95rem',
                transition: 'color 0.3s ease'
              }} onMouseEnter={(e) => e.target.style.color = '#00A85A'} onMouseLeave={(e) => e.target.style.color = darkMode ? '#000' : '#333333'}>
                Profile
              </Link>
            </li>
            <li className="nav-item me-4">
              <button className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold" onClick={toggleDarkMode} style={{
                borderColor: darkMode ? '#dee2e6' : '#00A85A',
                color: darkMode ? '#6c757d' : '#00A85A',
                transition: 'all 0.3s ease'
              }}>
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="/login" style={{
                color: darkMode ? '#000' : '#333333',
                fontSize: '0.95rem',
                transition: 'color 0.3s ease',
                position: 'relative'
              }} onMouseEnter={(e) => e.target.style.color = '#00A85A'} onMouseLeave={(e) => e.target.style.color = darkMode ? '#000' : '#333333'}>
                Get Started
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
