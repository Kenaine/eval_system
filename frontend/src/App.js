import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom"
import { createContext, useContext, useState, useEffect } from "react";
import Login from "./pages/login"
import Checklist from "./pages/checklist"
import ProgramCourseList from "./pages/program_course_list";
import Dashbaord from "./pages/dashboard";
import NewChecklist from "./pages/new_checklist";
import CourseList from "./pages/course_list";
import CurriculumList from "./pages/curriculum_list";
import AdminManagement from "./pages/admin";
import './App.css';
import apiClient from "./lib/api";
import { isStudent } from "./lib/auth";

const UserContext = createContext(null)
const CoursesContext = createContext(null)
const ProgramFunc = createContext(null)

function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [courses, setCourses] = useState([]);

  const getAuthToken = () => localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token');
  const getUserProfile = () => localStorage.getItem('user_profile') || sessionStorage.getItem('user_profile');
  const getDefaultAuthenticatedRoute = () => {
    try {
      const profile = JSON.parse(getUserProfile() || '{}');
      return isStudent(profile?.role) ? '/curriculum-checklist' : '/new';
    } catch {
      return '/new';
    }
  };

  const ProtectedRoute = ({ children, adminOnly = false }) => {
    const token = getAuthToken();
    if (!token) return <Navigate to="/" replace />;

    if (adminOnly && isStudent(currentUser?.role)) {
      return <Navigate to="/curriculum-checklist" replace />;
    }

    return children;
  };

  // Restore session from storage on mount (custom JWT flow)
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      localStorage.setItem('supabase_token', token);
      sessionStorage.removeItem('supabase_token');

      const profile = JSON.parse(getUserProfile() || '{}');
      localStorage.setItem('user_profile', JSON.stringify(profile));
      sessionStorage.removeItem('user_profile');
      setCurrentUser(profile);
    }
  }, []);

  const programGet = async () => {
    try {
      const progrms = await apiClient.get("/program/get");

      // Store as array - programs have program_id, program_name, program_specialization
      sessionStorage.setItem("programs", JSON.stringify(progrms.data));

      return progrms.data;

    } catch (err) {
      console.error("Getting programs failed: ", err);
    }
  }; 

  
  return (
    <ProgramFunc.Provider value={programGet}>
      <UserContext.Provider value={[currentUser, setCurrentUser]}>
        <CoursesContext.Provider value={[courses, setCourses]}>
            <Router>
              <Routes>
                <Route path="/" element={getAuthToken() ? <Navigate to={getDefaultAuthenticatedRoute()} replace /> : <Login />} />
                <Route path="/new" element={<ProtectedRoute adminOnly={true}><NewChecklist /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute adminOnly={true}><Dashbaord /></ProtectedRoute>} />
                <Route path="/curriculum-checklist" element={<ProtectedRoute><Checklist /></ProtectedRoute>} />
                <Route path="/course-list" element={<ProtectedRoute adminOnly={true}><CourseList /></ProtectedRoute>} />
                <Route path="/curriculum-list" element={<ProtectedRoute adminOnly={true}><CurriculumList /></ProtectedRoute>} />
                <Route path="/admin-page" element={<ProtectedRoute adminOnly={true}><AdminManagement /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to={getAuthToken() ? "/curriculum-checklist" : "/"} replace />} />
              </Routes>
            </Router>
        </CoursesContext.Provider>
      </UserContext.Provider>
    </ProgramFunc.Provider>
  );
}

export function useUser(){
  return useContext(UserContext)
}

export function useGetProgram(){
  return useContext(ProgramFunc)
}

export function useCourses(){
  return useContext(CoursesContext)
}

export default App;