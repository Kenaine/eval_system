import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import { createContext, useContext, useState, useEffect } from "react";
import Login from "./pages/login"
import Checklist from "./pages/checklist"
import ProgramCourseList from "./pages/program_course_list";
import Dashbaord from "./pages/dashboard";
import NewChecklist from "./pages/new_checklist";
import './App.css';
import apiClient from "./lib/api";
import { supabase, authHelpers } from "./lib/supabase";

const UserContext = createContext(null)
const CoursesContext = createContext(null)
const ProgramFunc = createContext(null)

function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        sessionStorage.setItem('supabase_token', session.access_token);
      } else {
        setCurrentUser(null);
        sessionStorage.removeItem('supabase_token');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await authHelpers.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        sessionStorage.setItem('supabase_token', session.access_token);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

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

  
  if (loading) {
    return <div>Loading...</div>;
  }

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