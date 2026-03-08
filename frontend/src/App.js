import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import { createContext, useContext, useState, useEffect } from "react";
import Login from "./pages/login"
import Checklist from "./pages/checklist"
import ProgramCourseList from "./pages/program_course_list";
import Dashbaord from "./pages/dashboard";
import NewChecklist from "./pages/new_checklist";
import CourseList from "./pages/course_list";
import CurriculumList from "./pages/curriculum_list";
import './App.css';
import apiClient from "./lib/api";

const UserContext = createContext(null)
const CoursesContext = createContext(null)
const ProgramFunc = createContext(null)

function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [courses, setCourses] = useState([]);

  // Restore session from sessionStorage on mount (custom JWT flow)
  useEffect(() => {
    const token = sessionStorage.getItem('supabase_token');
    if (token) {
      const profile = JSON.parse(sessionStorage.getItem('user_profile') || '{}');
      setCurrentUser(profile);
    }
  }, []);

  const programGet = async () => {
    try {
      const progrms = await apiClient.get("/program/get");

      const programsMap = {};

      progrms.data.forEach((p) => {
        programsMap[p.id] = p;

      });

      sessionStorage.setItem("programs", JSON.stringify(programsMap));


      return programsMap;


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
                <Route path="/" element={<Login />} />
                <Route path="/curriculum-checklist" element={<Checklist />} />
                <Route path="/program-courselist" element={<ProgramCourseList />} />
                <Route path="/dashboard" element={<Dashbaord />} />
                <Route path="/new" element={<NewChecklist />} />
                <Route path="/course-list" element={<CourseList />} />
                <Route path="/curriculum-list" element={<CurriculumList />} />
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