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
    const [showResetConfirm, setShowResetConfirm] = useState(false);

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
        // Filter is already updated and confirmed via backend API call in FilterPanel
        // Optionally auto-trigger a search if there's a current search query to keep results in sync
        console.log(`Filter updated: ${key} = ${value}`);
        // Users should search again to see updated results with new filters
    }

    const handleArchive = async () => {
        if (!currentStudent?.student_id) {
            alert("Please select a student first");
            return;
        }

        await axios.patch(API_URL + `/student/archive?student_id=${currentStudent.student_id}`)
        .then((res) =>{
            alert("Student archived successfully");
            setCurrentStudent({...currentStudent, archived: true});
        })
        .catch((error) =>{
            console.error("Error archiving student:", error);
            alert("Failed to archive student");
        });
    };

    const handleUnarchive = async () => {
        if (!currentStudent?.student_id) {
            alert("Please select a student first");
            return;
        }

        await axios.patch(API_URL + `/student/unarchive?student_id=${currentStudent.student_id}`)
        .then((res) =>
        {
            alert("Student unarchived successfully");
            setCurrentStudent({...currentStudent, archived: false});
        })
        .catch((error) =>{
            console.error("Error unarchiving student:", error);
            alert("Failed to unarchive student");
        });

    };

    const handleResetStudentPassword = async () => {
        if (!currentStudent?.student_id) {
            alert("Please select a student first");
            return;
        }

        setShowResetConfirm(true);
    };

    const confirmResetStudentPassword = async () => {
        if (!currentStudent?.student_id) {
            setShowResetConfirm(false);
            return;
        }

        await axios.post(API_URL + `/auth/reset-student-password/${currentStudent.student_id}`)
            .then(() => {
                setShowResetConfirm(false);
                alert("Student password reset successfully. Default password: #Uphsl123");
            })
            .catch((error) => {
                console.error("Error resetting student password:", error);
                alert(error.response?.data?.detail || "Failed to reset student password");
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

            {showResetConfirm && (
                <div className={style.resetConfirmOverlay}>
                    <div className={style.resetConfirmModal}>
                        <h3>Reset Password</h3>
                        <p>
                            Reset password for {currentStudent?.student_id} to default <b>#Uphsl123</b>?
                        </p>
                        <div className={style.resetConfirmActions}>
                            <button type="button" className={style.resetCancel} onClick={() => setShowResetConfirm(false)}>
                                Cancel
                            </button>
                            <button type="button" className={style.resetConfirm} onClick={confirmResetStudentPassword}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className={style.searchContainer}>
                <div className={style.section}>
                    <h2>Search Student</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <h5 style={{margin: "0 0 10px 0"}}>Press Enter to search</h5>
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
                                `${currentStudent?.l_name || ""}, ${currentStudent?.f_name || ""}${currentStudent?.m_name && String(currentStudent?.m_name).toLowerCase() !== "null" ? ` ${currentStudent?.m_name}` : ""}` :
                                ""}
                            </span>
                            <span>Program/Major: {currentStudent?.program_id}</span>
                            <span>Year: {currentStudent?.year} </span>
                            <span>Archived: {currentStudent?.archived ? 'Yes' : 'No'}</span>
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
                        <button className={style.btnSuccess} type="button" onClick={handleArchive} disabled={currentStudent?.archived}>
                            Archive
                        </button>
                        <button className={style.btnDanger} type="button" onClick={handleUnarchive} disabled={!currentStudent?.archived}>
                            Unarchive
                        </button>
                        <button className={style.btnReset} type="button" onClick={handleResetStudentPassword}>
                            Reset Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

