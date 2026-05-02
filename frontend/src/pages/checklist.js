import React, { useEffect, useState } from "react";
import { FaPrint, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/checklist.module.css";

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
    const SELECTED_STUDENT_KEY = "selected_curriculum_student_id";
    const SELECTED_STUDENT_DATA_KEY = "selected_curriculum_student_data";
    const SELECTED_STUDENT_COURSES_KEY = "selected_curriculum_student_courses";

    const readCachedJson = (key, fallbackValue) => {
        const raw = sessionStorage.getItem(key);
        if (!raw) {
            return fallbackValue;
        }

        try {
            return JSON.parse(raw);
        } catch {
            sessionStorage.removeItem(key);
            return fallbackValue;
        }
    };

    const [currentUser, setCurrentUser] = useUser();
    const [selectedStudent, setSelectedStudent] = useState(() => readCachedJson(SELECTED_STUDENT_DATA_KEY, null));
    const [courses, setCourses] = useState(() => readCachedJson(SELECTED_STUDENT_COURSES_KEY, []));
    const [isViewing, setIsViewing] = useState(() => {
        const cachedStudent = readCachedJson(SELECTED_STUDENT_DATA_KEY, null);
        return Boolean(cachedStudent?.student_id);
    });
    const studentView = isStudent(currentUser?.role);
    const adminView = isAdmin(currentUser?.role);

    const addStudent = async (student) => {
        try {
            await axios.post( API_URL + "/student/add", student, { withCredentials: true });
            handleStudentSelect(student.student_id);
        } catch (err) {
            console.error("Adding failed:", err);
            const errorMsg = err.response?.data?.detail || err.message || "Failed to add student";
            alert(`Error adding student: ${errorMsg}`);
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
            const errorMsg = err.response?.data?.detail || err.message || "Failed to edit student";
            alert(`Error editing student: ${errorMsg}`);
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
                sessionStorage.setItem(SELECTED_STUDENT_KEY, student_id);
                sessionStorage.setItem(SELECTED_STUDENT_DATA_KEY, JSON.stringify(res.data.student));
                sessionStorage.setItem(SELECTED_STUDENT_COURSES_KEY, JSON.stringify(res.data.courses || []));
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

    useEffect(() => {
        if (studentView) {
            return;
        }

        const savedStudentId = sessionStorage.getItem(SELECTED_STUDENT_KEY);
        if (savedStudentId) {
            handleStudentSelect(savedStudentId);
        }
    }, [studentView]);

    const handlePrint = () => {
        const student = selectedStudent?.student_id ? selectedStudent : currentUser;

        console.log(student);
        if (!student?.student_id) {
            alert("Please select a student first");
            return;
        }

        const printWindow = window.open("", "_blank");
        const printContent = generateCurriculumChecklistPrint(student, courses);
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const deleteStudent = async () => {
        if (!selectedStudent?.student_id) {
            alert("No student selected.");
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete student ${selectedStudent.full_name || selectedStudent.student_id}?`
        );

        if (!confirmDelete) {
            return; // ❌ user clicked "No"
        }

        try {
            await axios.delete(
                API_URL + `/student/delete/${selectedStudent.student_id}`,
                { withCredentials: true }
            );

            // ✅ Reset state
            setSelectedStudent(null);
            setCourses([]);
            setIsViewing(false);

            // ✅ Clear session storage
            sessionStorage.removeItem(SELECTED_STUDENT_KEY);
            sessionStorage.removeItem(SELECTED_STUDENT_DATA_KEY);
            sessionStorage.removeItem(SELECTED_STUDENT_COURSES_KEY);

            alert("Student deleted successfully.");
        } catch (err) {
            console.error("Delete failed:", err);
            const errorMsg = err.response?.data?.detail || err.message || "Failed to delete student";
            alert(`Error deleting student: ${errorMsg}`);
        }
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
                        Student Information
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
                                    className={`${style.editIcon} ${!isViewing ? style.disabled : ""}`}
                                    title="Print"
                                    onClick={handlePrint}
                                    disabled={!isViewing}
                                    style={{ cursor: isViewing ? "pointer" : "not-allowed" }}
                                />
                            )}
                            {adminView && (
                                <>
                                    <FaTrash 
                                        className={`${style.editIcon} ${!isViewing ? style.disabled: ""}`}
                                        style={{
                                            color: "#de0000",
                                            cursor: "pointer"
                                        }}
                                        title="Delete Student"
                                        onClick={deleteStudent}
                                    />
                                </>
                            )}
                        </span>
                    </h3>

                    <div className={style.studentResidency}>
                        <div className={style.lBlock}>
                            <span>Student ID: {currentUser?.student_id ?? selectedStudent?.student_id ?? "N/A"}</span>
                            <span>
                                Student Name: {selectedStudent?.full_name ?? currentUser?.full_name ?? "N/A"}
                            </span>
                            <span>Program/Major: {currentUser?.prgm_spec ?? selectedStudent?.prgm_spec ?? "N/A"}
                            </span>
                            <span>
                                Total Units Required for this Course: 
                                {currentUser?.total_units_required ?? selectedStudent?.total_units_required ?? "N/A"}</span>
                            <span>Gender: {currentUser?.gender ?? selectedStudent?.gender ?? "??"} </span>
                        </div>
                        <div className={style.rBlock}>
                            <span>Year: {currentUser?.year ?? selectedStudent?.year ?? "N/A"}</span>
                            <span>Status: {currentUser?.status ?? selectedStudent?.status ?? "N/A"}</span>
                            <span>Total Units Taken: {currentUser?.units_taken ?? selectedStudent?.units_taken ?? "N/A"}</span>
                            <span>GWA: {currentUser?.gwa ?? selectedStudent?.gwa ?? "N/A"}</span>
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