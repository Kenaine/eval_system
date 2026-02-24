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

// Helper function to add ordinal suffix to numbers
function ordinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export default function NewChecklist() {
    const pageName = "CURRICULUM CHECKLIST";
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
        if (!currentStudent?.id) {
            alert("Please select a student first");
            return;
        }

        await axios.post(API_URL + `/student/evaluate/${currentStudent.id}`)
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
        if (!currentStudent?.id) {
            alert("Please select a student first");
            return;
        }

        await axios.post(API_URL + `/student/take_off_evaluation/${currentStudent.id}`)
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
        if (!currentStudent?.id || studentCourses.length === 0) {
            alert("Please select a student first");
            return;
        }

        const printWindow = window.open("", "_blank");
        const studentName = `${currentStudent?.l_name}, ${currentStudent?.f_name} ${currentStudent?.m_name || ""}`.trim();

        // Sort courses by year and semester
        const sortedCourses = [...studentCourses].sort((a, b) =>
            a.year !== b.year ? a.year - b.year : a.semester - b.semester
        );

        // Build course table rows with year/semester headers
        let courseTableRows = "";
        let prevYear = null;
        let prevSem = null;

        sortedCourses.forEach((course) => {
            if (course.year !== prevYear || course.semester !== prevSem) {
                courseTableRows += `
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td colspan="6">${ordinal(course.year)} Year, ${ordinal(course.semester)} Sem</td>
                    </tr>
                `;
                prevYear = course.year;
                prevSem = course.semester;
            }

            courseTableRows += `
                <tr>
                    <td>${course.course_id}</td>
                    <td>${course.course_name}</td>
                    <td>${course.course_units}</td>
                    <td>${course.grade === null ? "-" : course.course_units}</td>
                    <td>${course.grade ?? "-"}</td>
                    <td>${course.remark}</td>
                </tr>
            `;
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Student Curriculum Checklist - ${studentName}</title>
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        color: #333;
                        font-size: 11px;
                        line-height: 1.2;
                    }
                    .student-info {
                        margin: 5px 0;
                        padding: 5px 0 5px 0;
                        border-bottom: 1px solid #333;
                    }
                    .student-info p {
                        margin: 2px 0;
                        font-size: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 5px;
                        font-size: 10px;
                    }
                    th, td {
                        border: 1px solid #999;
                        padding: 4px 3px;
                        text-align: left;
                        overflow: hidden;
                    }
                    th {
                        background-color: #4CAF50;
                        color: white;
                        font-weight: bold;
                        font-size: 9px;
                        padding: 3px 2px;
                    }
                    td {
                        word-break: break-word;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    h1 {
                        text-align: center;
                        margin: 0;
                        padding: 5px 0 3px 0;
                        font-size: 16px;
                    }
                    @media print {
                        html, body {
                            margin: 0;
                            padding: 0;
                        }
                        body {
                            margin: 3px;
                        }
                        thead {
                            display: table-header-group;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>Curriculum Checklist</h1>
                <div class="student-info">
                    <p><strong>Student ID:</strong> ${currentStudent?.id}</p>
                    <p><strong>Name:</strong> ${studentName}</p>
                    <p><strong>Program:</strong> ${currentStudent?.program_id}</p>
                    <p><strong>Year:</strong> ${currentStudent?.year}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>SUB CODE</th>
                            <th>SUB DESCRIPTION</th>
                            <th>TOTAL UNIT</th>
                            <th>CREDIT EARNED</th>
                            <th>GRADE</th>
                            <th>REMARK</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courseTableRows}
                    </tbody>
                </table>
                <script>
                    window.print();
                    window.close();
                </script>
            </body>
            </html>
        `;

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

                        <fieldset>
                            <legend style={{visibility: "hidden", position: "absolute"}}>filters</legend>

                            <FilterPanel onFilterChange={changeFilter} />
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
                            <span>Year: {currentStudent?.year} </span>
                            <span>Evaluated: {currentStudent?.evaluated}</span>
                        </div>

                        <div className={style.right}>
                            <span>Status: {currentStudent?.status} </span>
                            <span>Total Units: {currentStudent?.units_taken} </span>
                            <span>GWA: {currentStudent?.gwa} </span>
                            <span>Course Total Units: {currentStudent?.total_units_required}</span>
                        </div>

                        
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                        <button type="button" id="showCourse" onClick={() => setShowModal(true)}>See Course</button>
                        <button type="button" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FaPrint /> Print
                        </button>
                        <button type="button" onClick={handleEvaluate} style={{ backgroundColor: "#4CAF50", color: "white" }}>Evaluate</button>
                        <button type="button" onClick={handleTakeOffEvaluation} style={{ backgroundColor: "#f44336", color: "white" }}>Take off Evaluation</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

