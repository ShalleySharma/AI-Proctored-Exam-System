import React, { useState } from 'react';
import axios from 'axios';
import './createexam.css';

const CreateExam = () => {
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    description: '',
    date: '',
    duration: '',
    totalMarks: '',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [examCode, setExamCode] = useState('');

  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addQuestion = () => {
    // Removed validation constraints to allow adding questions with empty fields
    setExamData(prev => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }));

    setCurrentQuestion({
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: ''
    });

    setMessage('Question added successfully!');
    setTimeout(() => setMessage(''), 2000);
  };

  const removeQuestion = (index) => {
    setExamData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/exam/create', examData);
      setMessage('Exam created successfully!');
      setExamCode(response.data.examCode);

      // Clear the form for creating another exam
      setExamData({
        title: '',
        subject: '',
        description: '',
        date: '',
        duration: '',
        totalMarks: '',
        questions: []
      });

      // Auto-hide the exam code after 1 minute to allow creating another exam
      setTimeout(() => {
        setExamCode('');
        setMessage('');
      }, 60000);
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('teacherId');
        localStorage.removeItem('studentId');
        window.dispatchEvent(new Event('authChange'));
      } else {
        setMessage(error.response?.data?.message || 'Error creating exam');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-exam-container">
      <div className="create-exam-card">
        <h2 className="create-exam-title">
          <i className="bi bi-plus-circle-fill me-2"></i>
          Create New Exam
        </h2>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}

        {examCode && (
          <div className="exam-code-display">
            <div className="exam-code-card">
              <h5 className="exam-code-title">
                <i className="bi bi-key-fill me-2"></i>
                Exam Code Generated
              </h5>
              <div className="exam-code-value">
                {examCode}
              </div>
              <p className="exam-code-instruction">
                Share this code with students to join the exam.
              </p>
              <button
                type="button"
                className="btn-copy-code"
                onClick={() => {
                  navigator.clipboard.writeText(examCode);
                  alert('Exam code copied to clipboard!');
                }}
              >
                <i className="bi bi-clipboard me-2"></i>
                Copy Code
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="exam-details-section">
            <h4 className="section-title">Exam Details</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Exam Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={examData.title}
                  onChange={handleExamChange}
                  placeholder="Enter exam title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={examData.subject}
                  onChange={handleExamChange}
                  placeholder="Enter subject"
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Exam Date</label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={examData.date}
                  onChange={handleExamChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={examData.duration}
                  onChange={handleExamChange}
                  min="1"
                  placeholder="60"
                />
              </div>
              <div className="form-group">
                <label htmlFor="totalMarks">Total Marks</label>
                <input
                  type="number"
                  id="totalMarks"
                  name="totalMarks"
                  value={examData.totalMarks}
                  onChange={handleExamChange}
                  min="1"
                  placeholder="100"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={examData.description}
                onChange={handleExamChange}
                placeholder="Enter exam instructions or description"
                rows="3"
              />
            </div>
          </div>

          <div className="questions-section">
            <h4 className="section-title">Questions</h4>

            <div className="add-question-card">
              <h5>Add New Question</h5>

              <div className="form-group">
                <label>Question Text</label>
                <textarea
                  name="questionText"
                  value={currentQuestion.questionText}
                  onChange={handleQuestionChange}
                  placeholder="Enter your question"
                  rows="2"
                />
              </div>

              <div className="options-grid">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="form-group">
                    <label>Option {index + 1}</label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Correct Answer</label>
                  <select
                    name="correctAnswer"
                    value={currentQuestion.correctAnswer}
                    onChange={handleQuestionChange}
                  >
                    <option value="">Select correct answer</option>
                    {currentQuestion.options.map((option, index) => (
                      <option key={index} value={option}>{option || `Option ${index + 1}`}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Marks</label>
                  <input
                    type="number"
                    name="marks"
                    value={currentQuestion.marks}
                    onChange={handleQuestionChange}
                    min="1"
                    placeholder="5"
                  />
                </div>
              </div>

              <button type="button" className="btn-add-question" onClick={addQuestion}>
                <i className="bi bi-plus-circle me-2"></i>
                Add Question
              </button>
            </div>

            {examData.questions.length > 0 && (
              <div className="questions-list">
                <h5>Added Questions ({examData.questions.length})</h5>
                {examData.questions.map((question, index) => (
                  <div key={index} className="question-item">
                    <div className="question-header">
                      <span className="question-number">Q{index + 1}</span>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeQuestion(index)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                    <p className="question-text">{question.questionText}</p>
                    <div className="question-options">
                      {question.options.map((option, optIndex) => (
                        <span
                          key={optIndex}
                          className={`option ${option === question.correctAnswer ? 'correct' : ''}`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </span>
                      ))}
                    </div>
                    <span className="question-marks">Marks: {question.marks}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-create-exam" disabled={loading}>
              {loading ? (
                <>
                  <i className="bi bi-hourglass-split me-2"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Create Exam
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;
