import React, { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/checklist.module.css";
import buttonStyle from "../style/button.module.css";

import StudentSearchBar from "../component/searchBar";
import CourseTable from "../component/student_table";
import AddStudent from "../component/addStudent";
import EditStudent from "../component/editStudent";
import BulkUploadStudent from "../component/bulkUploadStudent";
import HeaderWebsite from "../component/header";
import { BulkGradeUpload } from "../component/student_table";

import { useUser, useCourses } from "../App";
import { API_URL } from "../misc/url";
import { isAdmin, isStudent } from "../lib/auth";
import { generateCurriculumChecklistPrint } from "../lib/printUtils";

export default function Checklist() {
    const pageName = "CURRICULUM CHECKLIST";
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useUser();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [courses, setCourses] = useState([]);
    const [isViewing, setIsViewing] = useState(false);
    const studentView = isStudent(currentUser?.role);
    const adminView = isAdmin(currentUser?.role);

    const addStudent = async (student) => {
        try {
            await axios.post( API_URL + "/student/add", student, { withCredentials: true });
            handleStudentSelect(student.student_id);
        } catch (err) {
            console.error("Adding failed:", err);
        }
    };

    const editStudent = async (student) => {
        try {
            await axios.put(
                API_URL + `/student/edit`,
                student,
                { withCredentials: true }
            );
            handleStudentSelect(student.student_id);
        } catch (err) {
            console.error("Editing failed:", err);
        }
    };

    const handleStudentSelect = async (student_id) => {
        try {
            const res = await axios.get( API_URL + `/student/get/${student_id}`, {
                withCredentials: true,
            });
            
            if (res.data && res.data.student) {
                setSelectedStudent(res.data.student);
                setCourses(res.data.courses || []);
                setIsViewing(true);
            } else {
                console.error("Invalid response format:", res.data);
                alert("Failed to load student data");
            }
        } catch (err) {
            console.error("Failed to fetch student details: ", err);
            alert(`Error: ${err.response?.data?.detail || err.message || "Failed to load student"}`);
        }
    };

    // Auto-load student's own data if they're logged in as a student
    useEffect(() => {
        if (studentView && currentUser?.student_id) {
            handleStudentSelect(currentUser.student_id);
        }
    }, [studentView, currentUser]);

    const handlePrint = () => {
        const student = currentUser?.student_id ? currentUser : selectedStudent;
        if (!student?.student_id) {
            alert("Please select a student first");
            return;
        }

        const printWindow = window.open("", "_blank");
        const printContent = generateCurriculumChecklistPrint(student, courses);
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />

            <div className={style.studentBody}>
                {adminView && (
                    <div className={style.studentSearchBarWrapper}>
                        <StudentSearchBar onSelectStudent={handleStudentSelect} />
                    </div>
                )}

                <div className={style.studentDetail}>
                    <h3>
                        STUDENT RESIDENCY EVALUATION
                        <span className={style.buttons}>
                            {adminView && (
                                <>
                                    <AddStudent onSubmit={addStudent} />
                                    <BulkUploadStudent onSuccess={() => {}} />
                                    <EditStudent
                                        onSubmit={editStudent}
                                        student={selectedStudent}
                                        isViewing={isViewing}
                                    />
                                </>
                            )}
                            {(studentView || adminView) && (
                                <FaPrint
                                    className={`${buttonStyle.editIcon} ${!isViewing ? buttonStyle.disabled : ""}`}
                                    title="Print"
                                    onClick={handlePrint}
                                    style={{ cursor: isViewing ? "pointer" : "not-allowed" }}
                                />
                            )}
                        </span>
                    </h3>

                    <div className={style.studentResidency}>
                        <div className={style.lBlock}>
                            <span>Student ID: {currentUser?.student_id ?? selectedStudent?.student_id ?? "N/A"}</span>
                            <span>
                                Student Name: {currentUser?.l_name ?? selectedStudent?.l_name ?? "N/A"},  
                                {currentUser?.f_name ?? selectedStudent?.f_name ?? ""}
                            </span>
                            <span>Program/Major: {currentUser?.program_id ?? selectedStudent?.program_id ?? "N/A"}</span>
                            <span>
                                Total Units Required for this Course: 
                                {currentUser?.total_units_required ?? selectedStudent?.total_units_required ?? "N/A"}</span>
                            <span>Gender: {currentUser?.gender ?? selectedStudent?.gender ?? "??"} </span>
                        </div>
                        <div className={style.rBlock}>
                            <span>Year: {currentUser?.year ?? selectedStudent?.year ?? "N/A"}</span>
                            <span>Status: {currentUser?.status ?? selectedStudent?.status ?? "N/A"}</span>
                            <span>Total Units Taken: {currentUser?.units_taken ?? selectedStudent?.units_taken ?? "N/A"}</span>
                            <span>GWA: {(currentUser?.gwa ?? selectedStudent?.gwa) ? 
                                        parseFloat(currentUser?.gwa ?? selectedStudent?.gwa).toFixed(2) : "N/A"}</span>
                        </div>
                    </div>

                    <CourseTable
                        student_id={selectedStudent?.student_id}
                        courses={courses}
                        role={currentUser?.role}
                        onSelectStudent={handleStudentSelect}
                    />
                </div>
            </div>
        </div>
    );
}