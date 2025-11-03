import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";

import GetStarted from "./components/GetStarted";
import StudentLogin from "./components/Login/Student/StudentLogin";
import StudentSignin from "./components/Signin/Student/StudentSignin";
import TeacherLogin from "./components/Login/Teacher/TeacherLogin";
import Instructions from "./components/Instructions";
import ExamPage from "./components/ExamPage";
import InstructorDashboard from "./components/InstructorDashboard";
import StudentDashboard from "./components/StudentDashboard";
import TeacherSignin from "./components/Signin/Teacher/TeacherSignin";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<GetStarted />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-signin" element={<StudentSignin />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-signin" element={<TeacherSignin />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/dashboard" element={<InstructorDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
