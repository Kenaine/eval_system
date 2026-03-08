import React from "react";
import apiClient from "../../lib/api";

import style from "../../style/new_checklist/new_checklist.module.css";

export default function SearchResult({student_list, setCurrentStudent, setStudentCourses}){

    const getStudent = async (student_id) => {
        try {
            const res = await apiClient.get(`/student/get/${student_id}`);
            setCurrentStudent(res.data.student);
            setStudentCourses(res.data.courses);
        } catch (err) {
            console.error("Failed to fetch student details: ", err);
            alert("Failed to load student information. Please try again.");
        }
    }

    return (
        <table className={style.searchResult}>
            <thead>
                <tr>
                    <th></th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Evaluated</th>
                </tr>
            </thead>
            <tbody>
                {student_list.map((student, index) => (
                    <tr key={index} onClick={() => getStudent(student.student_id)}>
                        <td>{index + 1}</td>
                            <td>{student.student_id}</td>
                            <td>{student.name}</td>
                            <td>{student.evaluated}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
