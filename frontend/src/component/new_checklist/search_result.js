import React from "react";
import axios from "axios";

import style from "../../style/new_checklist/new_checklist.module.css";

export default function SearchResult({student_list, setCurrentStudent, setStudentCourses}){

    const getStudent = async (student_id) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/student/get/${student_id}`, {
                withCredentials: true,
            });
            setCurrentStudent(res.data.student);
            setStudentCourses(res.data.courses);
        } catch (err) {
            console.error("Failed to fetch student details: ", err);
        }
    }

    return (
        <table className={style.searchResult}>
            <thead>
                <tr>
                    <th></th>
                    <th>Student ID</th>
                    <th>Name</th>
                </tr>
            </thead>
            <tbody>
                {student_list.map((student, index) => (
                    <tr key={index} onClick={() => getStudent(student.id)}>
                        <td>{index + 1}</td>
                            <td>{student.id}</td>
                            <td>{student.name}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
