import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './student profile.css';

function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/auth/student-profile');
      setStudent(res.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeExam = () => {
    navigate('/enter-exam');
  };

  if (loading) {
    return (
      <div className="student-profile-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!student) {
    return <div className="student-profile-error">Profile not found</div>;
  }

  return (
    <div className="student-profile-container">
      <div className="student-profile-card">
        <div className="student-profile-header">
          <div className="student-profile-image-container">
            <img
              src={student.photo_path || '/default-avatar.png'}
              alt="Profile"
              className="student-profile-image"
            />
          </div>
          <h1 className="student-profile-name">{student.name}</h1>
          <p className="student-profile-role">Student</p>
        </div>

        <div className="student-profile-info">
          <div className="student-profile-info-item">
            <div className="student-profile-info-label">Roll Number</div>
            <div className="student-profile-info-value">{student.roll_no}</div>
          </div>
          <div className="student-profile-info-item">
            <div className="student-profile-info-label">Course</div>
            <div className="student-profile-info-value">{student.course}</div>
          </div>
          <div className="student-profile-info-item">
            <div className="student-profile-info-label">Email</div>
            <div className="student-profile-info-value">{student.email}</div>
          </div>
          <div className="student-profile-info-item">
            <div className="student-profile-info-label">Year</div>
            <div className="student-profile-info-value">{student.year}</div>
          </div>
        </div>

        <div className="student-profile-actions">
          <button
            className="student-profile-exam-btn"
            onClick={handleTakeExam}
          >
            <i className="bi bi-play-circle me-2"></i>
            Take Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
