import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './teacherprofile.css';

function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/auth/teacher-profile');
      setTeacher(res.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = () => {
    navigate('/create-exam');
  };

  if (loading) {
    return (
      <div className="teacher-profile-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return <div className="teacher-profile-error">Profile not found</div>;
  }

  return (
    <div className="teacher-profile-container">
      <div className="teacher-profile-card">
        <div className="teacher-profile-header">
          <div className="teacher-profile-image-container">
            <img
              src={teacher.photo_path || '/default-avatar.png'}
              alt="Profile"
              className="teacher-profile-image"
            />
          </div>
          <h1 className="teacher-profile-name">{teacher.full_name}</h1>
          <p className="teacher-profile-role">Teacher</p>
        </div>

        <div className="teacher-profile-info">
          <div className="teacher-profile-info-item">
            <div className="teacher-profile-info-label">Email</div>
            <div className="teacher-profile-info-value">{teacher.email}</div>
          </div>
          <div className="teacher-profile-info-item">
            <div className="teacher-profile-info-label">School</div>
            <div className="teacher-profile-info-value">{teacher.school}</div>
          </div>
        </div>

        <div className="teacher-profile-actions">
          <button
            className="teacher-profile-exam-btn"
            onClick={handleCreateExam}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;
