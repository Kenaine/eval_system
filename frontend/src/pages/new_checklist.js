import React, { useEffect, useRef, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/new_checklist/new_checklist.module.css";

import HeaderWebsite from "../component/header";
import NewStudentSearchBar from "../component/new_checklist/new_searchBar";
import FilterPanel from "../component/new_checklist/filter_panel";
import SearchResult from "../component/new_checklist/search_result";
import CourseModal from "../component/new_checklist/courseModal";



export default function NewChecklist() {
    const pageName = "CURRICULUM CHECKLIST";
    const [students, setStudents] = useState([]);
    const [currentStudent, setCurrentStudent] = useState({});
    const [studentCourses, setStudentCourses] = useState([]);

    const [showModal, setShowModal] = useState(false);

    const dialogRef = useRef(0)

    useEffect(() => {
        if (dialogRef.current?.open && !showModal){
            dialogRef.current.close()
        } else if(!dialogRef.current?.open && showModal){
            dialogRef.current.showModal()
        }
    }, [showModal])

    useEffect(() => {
        console.log(currentStudent);
    }, [currentStudent]);

    return (
        <div>
            <CourseModal dialogRef={dialogRef} setShowModal={setShowModal} courses={studentCourses} />
            <HeaderWebsite pageName={pageName} />
            
            <div className={style.searchContainer}>
                <div className={style.section}>
                    <h2>Search Student</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <NewStudentSearchBar setStudents={setStudents}/>

                        <fieldset>
                            <legend>filters</legend>

                            <FilterPanel />
                        </fieldset>
                    </form>

                    <SearchResult student_list={students} setCurrentStudent={setCurrentStudent} setStudentCourses={setStudentCourses} />

                </div>

                <div className={`${style.section}`}>
                    <h2>Student Information</h2>
                    <div className={style.infoSection}>
                        <div className={style.left}>
                            <span>Student ID: {currentStudent?.id} </span>
                            <span>
                                Student Name: {Object.keys(currentStudent).length !== 0 ?
                                currentStudent?.l_name + ", " + currentStudent?.f_name + " " + currentStudent?.m_name :
                                ""}
                            </span>
                            <span>Program/Major: {currentStudent?.program_id}</span>
                            <span>
                                Course Total Units: {currentStudent?.total_units_required}
                            </span>
                        </div>

                        <div className={style.right}>
                            <span>Year: {currentStudent?.year} </span>
                            <span>Status: {currentStudent?.status} </span>
                            <span>Total Units: {currentStudent?.units_taken} </span>
                            <span>GWA: {currentStudent?.gwa} </span>
                        </div>

                        
                    </div>

                    <button type="button" id="showCourse" onClick={() => setShowModal(true)}>See Course</button>
                </div>
            </div>
        </div>
    );
}