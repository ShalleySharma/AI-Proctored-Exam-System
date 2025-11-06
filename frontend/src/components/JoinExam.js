import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './JoinExam.css';

const JoinExam = () => {
  const [code, setCode] = useState('');
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!code.trim()) {
      setMessage('Please enter an exam code');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.get(`/api/exam/join/${code.trim().toUpperCase()}`);
      setExam(response.data.exam);
      setMessage('Exam found! Click "Start Exam" to begin.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Invalid exam code');
      setExam(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    // Navigate to exam page with exam data
    navigate('/exam', { state: { exam } });
  };

  return (
    <div className="join-exam-container">
      <div className="join-exam-card">
        <h2 className="join-exam-title">
          <i className="bi bi-key-fill me-2"></i>
          Join Exam
        </h2>

        <p className="join-exam-subtitle">
          Enter the exam code provided by your teacher to start the test.
        </p>

        {message && (
          <div className={`alert ${message.includes('found') || message.includes('Click') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}

        <div className="join-exam-form">
          <div className="form-group">
            <label htmlFor="examCode">Exam Code</label>
            <input
              type="text"
              id="examCode"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter exam code (e.g. A4B2C9)"
              maxLength="6"
              className="exam-code-input"
            />
          </div>

          <button
            type="button"
            className="btn-join-exam"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="bi bi-hourglass-split me-2"></i>
                Searching...
              </>
            ) : (
              <>
                <i className="bi bi-search me-2"></i>
                Find Exam
              </>
            )}
          </button>
        </div>

        {exam && (
          <div className="exam-details-card">
            <h3 className="exam-details-title">
              <i className="bi bi-journal-check me-2"></i>
              Exam Details
            </h3>

            <div className="exam-info">
              <div className="info-item">
                <span className="info-label">Title:</span>
                <span className="info-value">{exam.title}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Subject:</span>
                <span className="info-value">{exam.subject}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Date:</span>
                <span className="info-value">
                  {new Date(exam.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Duration:</span>
                <span className="info-value">{exam.duration} minutes</span>
              </div>

              <div className="info-item">
                <span className="info-label">Total Marks:</span>
                <span className="info-value">{exam.totalMarks}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Questions:</span>
                <span className="info-value">{exam.questions?.length || 0}</span>
              </div>

              {exam.description && (
                <div className="info-item full-width">
                  <span className="info-label">Instructions:</span>
                  <span className="info-value">{exam.description}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-start-exam"
              onClick={handleStartExam}
            >
              <i className="bi bi-play-circle-fill me-2"></i>
              Start Exam
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinExam;
