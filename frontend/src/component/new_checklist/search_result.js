import React from "react";

import style from "../../style/new_checklist/new_checklist.module.css";

export default function SearchResult({student_list}){
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
                    <tr key={index}>
                        <td>{index + 1}</td>
                            <td>{student.id}</td>
                            <td>{student.name}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
