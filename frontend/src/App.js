import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Instructions from "./components/Instructions";
import ExamPage from "./components/ExamPage";
import InstructorDashboard from "./components/InstructorDashboard";
import StudentDashboard from "./components/StudentDashboard";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/dashboard" element={<InstructorDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
