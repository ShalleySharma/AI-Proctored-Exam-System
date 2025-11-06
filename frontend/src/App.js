import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";

import GetStarted from "./components/GetStarted/GetStarted";
import StudentLogin from "./components/Login/Student/StudentLogin";
import StudentSignup from "./components/Signin/Student/StudentSignup.js";
import TeacherLogin from "./components/Login/Teacher/TeacherLogin";
import Instructions from "./components/Instructions";
import ExamPage from "./components/ExamPage";
import InstructorDashboard from "./components/Dashboard/Teacher/InstructorDashboard";
import StudentDashboard from "./components/Dashboard/Student/StudentDashboard";
import TeacherSignin from "./components/Signin/Teacher/TeacherSignup.js";
import TeacherProfile from "./components/Profile/Teacher/teacherprofile.js";
import StudentProfile from "./components/Profile/Student/studentprofile.js";
import CreateExam from "./components/Create Exam/createexam.js";
import JoinExam from "./components/JoinExam.js";
import EnterExam from "./components/Enter Exam/enterexam.js";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<GetStarted />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-signup" element={<StudentSignup />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-signin" element={<TeacherSignin />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/teacher-profile" element={<ProtectedRoute teacherOnly={true}><TeacherProfile /></ProtectedRoute>} />
        <Route path="/student-profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
        <Route path="/create-exam" element={<ProtectedRoute teacherOnly={true}><CreateExam /></ProtectedRoute>} />
        <Route path="/join-exam" element={<ProtectedRoute><JoinExam /></ProtectedRoute>} />
        <Route path="/enter-exam" element={<ProtectedRoute><EnterExam /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute teacherOnly={true}><InstructorDashboard /></ProtectedRoute>} />
        <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
export default App;
