# AI-Proctored-Exam-System

An AI-powered automated exam proctoring system that detects face spoofing, eye movement, and multiple faces to ensure secure and fair online assessments.

## Project Description

This full-stack application provides a secure environment for conducting online examinations. It features real-time webcam monitoring, AI-based face recognition, behavioral analysis, and comprehensive dashboards for instructors and students. The system captures periodic snapshots, detects violations such as face spoofing or multiple faces, and provides detailed session reviews.

## Features

- **Real-Time Monitoring**: Continuous webcam surveillance with periodic snapshots
- **AI-Powered Detection**: Face spoofing detection, multiple face recognition, and suspicious behavior analysis
- **Authentication System**: Secure signup and login with photo verification
- **Instructor Dashboard**: Comprehensive session management, violation tracking, and snapshot review
- **Student Dashboard**: Exam access and progress tracking
- **File Upload Handling**: Support for photo uploads during registration and login
- **Responsive UI**: Modern, mobile-friendly interface built with React and Bootstrap

## Tech Stack

### Frontend
- React 19.2.0
- React Router DOM 7.9.3
- Bootstrap 5.3.8
- Axios 1.12.2
- Testing Library (Jest, React Testing Library)

### Backend
- Node.js with Express 5.1.0
- MongoDB with Mongoose 8.19.1
- JWT for authentication
- Multer for file uploads
- bcryptjs for password hashing
- CORS for cross-origin requests

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ShalleySharma/AI-Proctored-Exam-System.git
   cd AI-Proctored-Exam-System
   ```

2. **Install root dependencies:**
   ```bash
   npm install
   ```

3. **Set up the backend:**
   ```bash
   cd backend
   npm install
   ```

4. **Set up the frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Environment Configuration:**
   Create a `.env` file in the `backend` directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/proctoring-system
   JWT_SECRET=your-secret-key
   ```

## Usage

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend application:**
   ```bash
   cd frontend
   npm start
   ```
   The app will open in your browser at `http://localhost:3000`

3. **Access the application:**
   - Navigate to `http://localhost:3000` to view the home page
   - Sign up or log in to access the dashboards
   - Instructors can manage exams and review sessions
   - Students can take exams with proctoring enabled

## API Endpoints

### Authentication Routes (`/api/auth`)

- **POST /api/auth/signup**
  - Registers a new student
  - Body: `name`, `roll_no`, `course`, `year`, `email`, `password`
  - File: `photo` (multer upload)
  - Response: Success message or error

- **POST /api/auth/login**
  - Authenticates a student
  - Body: `email`, `password`
  - File: `photo` (multer upload for face verification)
  - Response: JWT token and student ID

### Exam Routes (`/api/exam`)
- Additional exam-related endpoints (implementation details in `backend/routes/exam.js`)

## Project Structure

```
AI-Proctored-Exam-System/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Exam.js
│   │   ├── Session.js
│   │   ├── Snapshot.js
│   │   └── Student.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── exam.js
│   ├── uploads/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── snapshots/
│   │   └── violations/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── images/
│   │   └── ...
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   ├── ExamPage.js
│   │   │   ├── InstructorDashboard.js
│   │   │   ├── StudentDashboard.js
│   │   │   └── ...
│   │   ├── App.js
│   │   └── ...
│   └── package.json
├── package.json
├── README.md
└── TODO.md
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
---

**Note:** This system is designed for educational purposes. Ensure compliance with privacy laws and regulations when implementing in production environments.
