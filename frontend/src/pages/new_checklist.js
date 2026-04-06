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

import { API_URL } from "../misc/url";
import { generateCurriculumChecklistPrint } from "../lib/printUtils";

export default function NewChecklist() {
    const pageName = "NEW CHECKLIST";
    const [students, setStudents] = useState([]);
    const [currentStudent, setCurrentStudent] = useState({});
    const [studentCourses, setStudentCourses] = useState([]);

    const [showModal, setShowModal] = useState(false);

    const dialogRef = useRef(0)
    const printRef = useRef(null);

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

    const changeFilter = (key, value) => {
        // Filter is already updated via API call in FilterPanel
        // This callback can be used to trigger additional UI updates if needed
        console.log(`Filter updated: ${key} = ${value}`);
    }

    const handleEvaluate = async () => {
        if (!currentStudent?.student_id) {
            alert("Please select a student first");
            return;
        }

        await axios.post(API_URL + `/student/evaluate/${currentStudent.student_id}`)
        .then((res) =>{
            alert("Student evaluated successfully");
            setCurrentStudent({...currentStudent, evaluated: res.data.timestamp});
        })
        .catch((error) =>{
            console.error("Error evaluating student:", error);
            alert("Failed to evaluate student");
        });
    };

    const handleTakeOffEvaluation = async () => {
        if (!currentStudent?.student_id) {
            alert("Please select a student first");
            return;
        }

        await axios.post(API_URL + `/student/take_off_evaluation/${currentStudent.student_id}`)
        .then((res) =>
        {
            alert("Evaluation removed succesfully");
            setCurrentStudent({...currentStudent, evaluated: null});
        })
        .catch((error) =>{
            console.error("Error removing evaluation:", error);
            alert("Failed to remove evaluation");
        });

    };

    const handlePrint = () => {
        if (!currentStudent?.student_id) {
            alert("Please select a student first");
            return;
        }

        const printWindow = window.open("", "_blank");
        const printContent = generateCurriculumChecklistPrint(currentStudent, studentCourses);
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    return (
        <div>
            <CourseModal dialogRef={dialogRef} setShowModal={setShowModal} courses={studentCourses} />
            <HeaderWebsite pageName={pageName} />
            
            <div className={style.searchContainer}>
                <div className={style.section}>
                    <h2>Search Student</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <NewStudentSearchBar setStudents={setStudents}/>
                        <FilterPanel onFilterChange={changeFilter} />
                    </form>

                    <SearchResult student_list={students} setCurrentStudent={setCurrentStudent} setStudentCourses={setStudentCourses} />

                </div>

                <div className={`${style.section}`}>
                    <h2>Student Information</h2>
                    <div className={style.infoSection}>
                        <div className={style.left}>
                            <span>Student ID: {currentStudent?.student_id} </span>
                            <span>
                                Student Name: {Object.keys(currentStudent).length !== 0 ?
                                currentStudent?.l_name + ", " + currentStudent?.f_name + " " + currentStudent?.m_name :
                                ""}
                            </span>
                            <span>Program/Major: {currentStudent?.program_id}</span>
                            <span>Year: {currentStudent?.year} </span>
                            <span>Evaluated: {currentStudent?.evaluated || 'Not evaluated'}</span>
                        </div>

                        <div className={style.right}>
                            <span>Status: {currentStudent?.status} </span>
                            <span>Total Units: {currentStudent?.units_taken || 0} </span>
                            <span>GWA: {currentStudent?.gwa || 0} </span>
                            <span>Course Total Units: {currentStudent?.total_units_required || 0}</span>
                        </div>

                        
                    </div>

                    <div className={style.buttonGroup}>
                        <button className={style.btnPrimary} type="button" onClick={() => setShowModal(true)}>
                            See Course
                        </button>
                        <button className={style.btnSecondary} type="button" onClick={handlePrint}>
                            <FaPrint /> Print
                        </button>
                        <button className={style.btnSuccess} type="button" onClick={handleEvaluate}>
                            Evaluate
                        </button>
                        <button className={style.btnDanger} type="button" onClick={handleTakeOffEvaluation}>
                            Take off Evaluation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

