import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import { createContext, useContext, useState } from "react";
import Login from "./pages/login"
import Checklist from "./pages/checklist"
import ProgramCourseList from "./pages/program_course_list";
import Dashbaord from "./pages/dashboard";
import NewChecklist from "./pages/new_checklist";
import './App.css';
import axios from "axios";

const UserContext = createContext(null)
const CoursesContext = createContext(null)
const ProgramFunc = createContext(null)

function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [courses, setCourses] = useState([]);

  const programGet = async () => {
    try {
      const progrms = await axios.get("http://127.0.0.1:8000/program/get");

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

  const checkCredential = async (username, password) => {
    const response = await axios.post(
        'http://127.0.0.1:8000/auth/login',
        new URLSearchParams({
            username: username.trim(),
            password: password.trim()
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            withCredentials: true
        }
    );

    console.log(response.data);

    await programGet(); 

    return response.status === 200;

  };
  return (
    <ProgramFunc.Provider value={programGet}>
      <UserContext.Provider value={[currentUser, setCurrentUser]}>
        <CoursesContext.Provider value={[courses, setCourses]}>
            <Router>
              <Routes>
                <Route path="/" element={<Login checkCredential={checkCredential}/>} />
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