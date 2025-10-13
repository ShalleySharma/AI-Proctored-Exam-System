import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && toggleRef.current && !toggleRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${darkMode ? 'navbar-light bg-light' : 'navbar-dark bg-dark'} shadow-sm`}>
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold fs-4" to="/" style={{ color: darkMode ? '#000' : '#fff' }}>
          proctoAI
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item me-3">
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
            </li>
            <li className="nav-item me-3">
              <Link className="nav-link" to="/about">About</Link>
            </li>
            <li className="nav-item me-3">
              <Link className="nav-link" to="/profile">Profile</Link>
            </li>
            <li className="nav-item me-3">
              <button className="btn btn-outline-secondary" onClick={toggleDarkMode}>
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </li>
            <li className="nav-item">
              <a className="nav-link dropdown-toggle" href="#" onClick={toggleDropdown} role="button" ref={toggleRef}>
                Account
              </a>
              <ul className={`dropdown-menu ${dropdownOpen ? 'show' : ''} ${darkMode ? 'dropdown-menu-light' : 'dropdown-menu-dark'}`} ref={dropdownRef}>
                <li><Link className="dropdown-item" to="/login">Login</Link></li>
                <li><Link className="dropdown-item" to="/signup">Signup</Link></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
