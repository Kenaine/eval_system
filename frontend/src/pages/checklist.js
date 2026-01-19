import React, { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/checklist.module.css";

import StudentSearchBar from "../component/searchBar";
import CourseTable from "../component/student_table";
import AddStudent from "../component/addStudent";
import EditStudent from "../component/editStudent";
import HeaderWebsite from "../component/header";
import { BulkGradeUpload } from "../component/student_table";

import { useUser, useCourses } from "../App";

export default function Checklist() {
    const pageName = "CURRICULUM CHECKLIST";
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useUser();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [courses, setCourses] = useCourses()
    const [isViewing, setIsViewing] = useState(false);

    const addStudent = async (student) => {
        try {
            await axios.post("http://127.0.0.1:8000/student/add", student, { withCredentials: true });
            handleStudentSelect(student.student_id);
        } catch (err) {
            console.error("Adding failed:", err);
        }
    };

    const editStudent = async (student) => {
        try {
            await axios.put(
                `http://127.0.0.1:8000/student/edit`,
                student,
                { withCredentials: true }
            );
            handleStudentSelect(student.id);
        } catch (err) {
            console.error("Editing failed:", err);
        }
    };

    const handleStudentSelect = async (student_id) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/student/get/${student_id}`, {
                withCredentials: true,
            });
            setSelectedStudent(res.data.student);
            setCourses(res.data.courses);
            setIsViewing(true);
        } catch (err) {
            console.error("Failed to fetch student details: ", err);
        }
    };

    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />

            <div className={style.studentBody}>
                <div className={style.studentSearchBarWrapper}>
                        <StudentSearchBar onSelectStudent={handleStudentSelect} />
                </div>

                <div className={style.studentDetail}>
                    <h3>
                        STUDENT RESIDENCY EVALUATION
                        <span className={style.buttons}>

                            <AddStudent onSubmit={addStudent} />
                            <EditStudent
                                onSubmit={editStudent}
                                student={selectedStudent}
                                isViewing={isViewing}
                            />
                            <FaPrint
                                style={{ cursor: "pointer" }}
                                title="Print"
                                onClick={() => window.print()}
                            />
                        </span>
                    </h3>

                    <div className={style.studentResidency}>
                        <div className={style.lBlock}>
                            <span>Student ID: {currentUser?.id ?? selectedStudent?.id ?? "N/A"}</span>
                            <span>
                                Student Name: {currentUser?.l_name ?? selectedStudent?.l_name ?? "N/A"},  
                                {currentUser?.f_name ?? selectedStudent?.f_name ?? ""}
                            </span>
                            <span>Program/Major: {currentUser?.program_id ?? selectedStudent?.program_id ?? "N/A"}</span>
                            <span>
                                Total Units Required for this Course: 
                                {currentUser?.total_units_required ?? selectedStudent?.total_units_required ?? "N/A"}</span>
                        </div>
                        <div className={style.rBlock}>
                            <span>Year: {currentUser?.year ?? selectedStudent?.year ?? "N/A"}</span>
                            <span>Status: {currentUser?.status ?? selectedStudent?.status ?? "N/A"}</span>
                            <span>Total Units Taken: {currentUser?.units_taken ?? selectedStudent?.units_taken ?? "N/A"}</span>
                            <span>GWA: {currentUser?.gwa ?? selectedStudent?.gwa ?? "N/A"}</span>
                        </div>
                    </div>

                    <CourseTable
                        student_id={selectedStudent?.id}
                        courses={courses}
                        role={currentUser?.role}
                        onSelectStudent={handleStudentSelect}
                    />
                </div>
            </div>
        </div>
    );
}