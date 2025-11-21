# AI-Proctored-Exam-System

An advanced AI-powered automated exam proctoring system that utilizes machine learning for real-time detection of cheating behaviors during online assessments.

## Project Description

This comprehensive full-stack application provides a secure and intelligent environment for conducting online examinations. It integrates cutting-edge AI technologies including YOLOv8 object detection and TensorFlow.js face recognition to monitor students in real-time. The system captures periodic snapshots, analyzes webcam feeds for suspicious activities, and generates detailed reports for instructors. Key capabilities include face spoofing detection, multiple face recognition, prohibited object detection (phones, books, etc.), gaze tracking, and behavioral analysis.

## Features

### Core Proctoring Features
- **Real-Time AI Monitoring**: Continuous webcam surveillance with AI-powered analysis
- **Face Detection & Verification**: Multi-face detection, face spoofing prevention, and identity verification
- **Object Detection**: Automatic detection of prohibited items (cell phones, books, laptops, tablets, bottles)
- **Behavioral Analysis**: Eye movement tracking, head pose analysis, and gaze direction monitoring
- **Violation Tracking**: Comprehensive logging of all detected violations with timestamps

### Exam Management
- **Exam Creation**: Teachers can create, edit, and manage exams with custom questions
- **Session Management**: Secure exam sessions with unique codes and time tracking
- **Live Proctoring**: Real-time monitoring during exam taking
- **Result Generation**: Automated PDF reports with violation summaries and screenshots

### User Dashboards
- **Instructor Dashboard**: Session overview, violation review, snapshot analysis, and student performance tracking
- **Student Dashboard**: Exam access, progress monitoring, and result viewing
- **Authentication System**: Secure signup/login with photo verification for both teachers and students

### Technical Features
- **Multi-Server Architecture**: Separate servers for frontend, backend API, and ML processing
- **Cloud Storage**: Cloudinary integration for secure snapshot storage
- **Database Integration**: MongoDB for user data, exam data, and session logs
- **Responsive UI**: Modern React-based interface with Bootstrap styling

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
- Sharp for image processing
- Axios for inter-service communication

### Machine Learning Server
- Python 3.x with Flask
- YOLOv8 (Ultralytics) for object detection
- OpenCV for image processing
- PIL (Pillow) for image handling
- NumPy for numerical computations
- TensorFlow.js (via Node.js backend) for face landmarks and blazeface detection

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn package manager
- Python 3.8 or higher
- pip (Python package manager)
- MongoDB (local or cloud instance, e.g., MongoDB Atlas)
- Git

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

5. **Set up the Machine Learning server:**
   ```bash
   cd ../backend/ml
   pip install -r requirements.txt
   ```
   Note: Create a `requirements.txt` file in `backend/ml/` with the following dependencies:
   ```
   flask
   ultralytics
   opencv-python
   pillow
   numpy
   ```

6. **Environment Configuration:**
   Create a `.env` file in the `backend` directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/proctoring-system
   JWT_SECRET=your-secret-key-here
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

## Usage

1. **Start MongoDB:**
   Ensure MongoDB is running on your system or update the `MONGODB_URI` in `.env` for cloud instance.

2. **Start the Machine Learning server:**
   ```bash
   cd backend/ml
   python ml_server.py
   ```
   The ML server will run on `http://localhost:5001`

3. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   The backend API server will run on `http://localhost:5000`

4. **Start the frontend application:**
   ```bash
   cd frontend
   npm start
   ```
   The React app will open in your browser at `http://localhost:3000`

5. **Access the application:**
   - Navigate to `http://localhost:3000` to view the home page
   - Sign up or log in as a teacher or student
   - Teachers can create exams and monitor sessions
   - Students can join exams and take them with AI proctoring enabled

## ML Features

The AI proctoring system uses advanced machine learning techniques:

### Object Detection (YOLOv8)
- Detects prohibited objects: cell phones, books, laptops, tablets, bottles
- Person counting and face detection
- Real-time analysis of webcam snapshots

### Face and Behavioral Analysis (TensorFlow.js)
- Face landmark detection for spoofing prevention
- Multiple face recognition
- Head pose estimation
- Gaze direction analysis

### Violation Detection
- **ml_no_face_detected**: No face visible in frame
- **ml_multiple_faces_detected**: Multiple faces detected
- **ml_object_detected**: Prohibited objects found
- **ml_head_pose_away**: Student looking away from screen
- **ml_gaze_away**: Eyes not focused on exam area

### Processing Pipeline
1. Periodic webcam snapshots captured during exam
2. Images sent to Python ML server for YOLO analysis
3. Violations logged and snapshots saved to Cloudinary if cheating detected
4. Real-time feedback provided to student interface
5. Comprehensive reports generated for instructors

## API Endpoints

### Authentication Routes (`/api/auth`)
- **POST /api/auth/signup** - Register new student/teacher with photo
- **POST /api/auth/login** - Authenticate user with photo verification

### Exam Routes (`/api/exam`)
- **POST /api/exam/start** - Start exam session
- **POST /api/exam/violation** - Log violation event
- **POST /api/exam/snapshot** - Process snapshot with ML detection
- **POST /api/exam/process-snapshot** - Alternative snapshot processing
- **GET /api/exam/sessions** - Get all sessions (admin)
- **GET /api/exam/teacher-sessions** - Get teacher's exam sessions
- **GET /api/exam/snapshots/:sessionId** - Get snapshots for session
- **POST /api/exam/submit** - Submit exam results
- **GET /api/exam/student-results/:studentId** - Get student exam results
- **POST /api/exam/create** - Create new exam (teacher)
- **GET /api/exam/teacher-exams** - Get teacher's exams
- **GET /api/exam/student-exams** - Get available exams for students
- **GET /api/exam/:id** - Get specific exam details
- **PUT /api/exam/:id** - Update exam (teacher)
- **DELETE /api/exam/:id** - Delete exam (teacher)
- **GET /api/exam/join/:code** - Join exam by code
- **POST /api/exam/validate** - Validate exam ID and roll number
- **POST /api/exam/save-photo** - Save enter photo
- **POST /api/exam/process-ml** - Process ML for snapshot
- **GET /api/exam/download-pdf/:sessionId** - Download result PDF
- **GET /api/exam/health** - Health check

### ML Routes (`/api/ml`)
- Routes for ML service communication (implementation in `backend/ml/routes/mlRoutes.js`)

## Project Structure

```
AI-Proctored-Exam-System/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── ml/
│   │   ├── ml_server.py          # Python Flask ML server
│   │   ├── ml_detections.py       # ML detection utilities
│   │   ├── ml_service.py          # ML service functions
│   │   ├── test_model.py          # Model testing scripts
│   │   ├── yolov8l.pt             # YOLOv8 model weights
│   │   ├── models/                # Additional ML models
│   │   ├── routes/
│   │   │   └── mlRoutes.js        # ML API routes
│   │   ├── services/
│   │   │   ├── pdfGenerator.js    # PDF report generation
│   │   │   └── screenshotHandler.js # Screenshot processing
│   │   └── utils/
│   │       ├── logger.js          # Logging utilities
│   │       ├── mlProcessor.js     # ML processing logic
│       │   ├── pythonObjectDetection.js # Python ML integration
│       │   └── violationCounter.js # Violation tracking
│   ├── models/
│   │   ├── Exam.js
│   │   ├── Session.js
│   │   ├── Snapshot.js
│   │   ├── Student.js
│   │   └── Teacher.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── exam.js
│   ├── uploads/                   # File upload directories
│   │   ├── snapshots/
│   │   ├── enter_photos/
│   │   └── ...
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.css
│   │   │   ├── Home.js
│   │   │   ├── Navbar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── ToastContext.jsx
│   │   │   ├── Create Exam/
│   │   │   │   ├── createexam.css
│   │   │   │   └── createexam.js
│   │   │   ├── Dashboard/
│   │   │   │   ├── Student/
│   │   │   │   │   ├── ResultPDF.js
│   │   │   │   │   └── StudentDashboard.js
│   │   │   │   └── Teacher/
│   │   │   │       └── InstructorDashboard.js
│   │   │   ├── Enter Exam/
│   │   │   │   ├── enterexam.css
│   │   │   │   └── enterexam.js
│   │   │   ├── GetStarted/
│   │   │   │   ├── GetStarted.css
│   │   │   │   └── GetStarted.js
│   │   │   ├── Instructions/
│   │   │   │   ├── Instructions.css
│   │   │   │   └── Instructions.js
│   │   │   ├── JoinExam/
│   │   │   │   ├── JoinExam.css
│   │   │   │   └── JoinExam.js
│   │   │   ├── Login/
│   │   │   │   ├── Student/
│   │   │   │   │   ├── StudentLogin.css
│   │   │   │   │   └── StudentLogin.js
│   │   │   │   └── Teacher/
│   │   │   │       ├── TeacherLogin.css
│   │   │   │       └── TeacherLogin.js
│   │   │   ├── Profile/
│   │   │   │   ├── Student/
│   │   │   │   │   ├── studentprofile.css
│   │   │   │   │   └── studentprofile.js
│   │   │   │   └── Teacher/
│   │   │   │       ├── teacherprofile.css
│   │   │   │       └── teacherprofile.js
│   │   │   ├── Signin/
│   │   │   │   ├── Student/
│   │   │   │   │   ├── StudentSignup.css
│   │   │   │   │   └── StudentSignup.js
│   │   │   │   └── Teacher/
│   │   │   │       ├── TeacherSignup.css
│   │   │   │       └── TeacherSignup.js
│   │   │   ├── Take Exam/
│   │   │   │   ├── takeexam.css
│   │   │   │   └── takeexam.js
│   │   │   └── ExamPage.js
│   │   ├── utils/
│   │   │   ├── auth.js
│   │   │   ├── liveMonitoring.js
│   │   │   └── retryQueue.js
│   │   ├── App.js
│   │   ├── index.css
│   │   ├── index.js
│   │   └── reportWebVitals.js
│   └── package.json
├── package.json
├── README.md
├── TODO.md
└── .gitignore
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- YOLOv8 by Ultralytics for object detection
- TensorFlow.js for face recognition capabilities
- React and Express communities for excellent documentation
- Bootstrap for responsive UI components

---

For more information or support, please open an issue in the repository.
