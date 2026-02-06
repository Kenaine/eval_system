import React from "react";
import style from "../../style/table.module.css";

// Helper function to add ordinal suffix to numbers (1 -> 1st, 2 -> 2nd, etc.)
function ordinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export default function CourseModal({dialogRef, setShowModal, courses = []}){
    return(
        <dialog ref={dialogRef}>
            <div style={{ padding: "20px", maxHeight: "90vh", overflowY: "auto" }}>
                <h2>Student Courses</h2>
                <table className={style.tble}>
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
                        {courses?.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center" }}>
                                    No courses found.
                                </td>
                            </tr>
                        ) : (
                            (() => {
                                const sorted = [...courses].sort((a, b) =>
                                    a.year !== b.year ? a.year - b.year : a.semester - b.semester
                                );

                                const rows = [];
                                let prevYear = null;
                                let prevSem = null;

                                sorted.forEach((course, index) => {
                                    const { year, semester } = course;

                                    if (year !== prevYear || semester !== prevSem) {
                                        rows.push(
                                            <tr key={`label-${index}`} className={style.yearSem}>
                                                <td colSpan="6" style={{ fontWeight: "bold" }}>
                                                    {ordinal(year)} Year, {ordinal(semester)} Sem
                                                </td>
                                            </tr>
                                        );
                                        prevYear = year;
                                        prevSem = semester;
                                    }

                                    rows.push(
                                        <tr key={index} className={
                                                course.remark === "Passed"     ? style.passedRow :
                                                course.remark === "Incomplete" ? style.incompleteRow :
                                                course.remark === "Failed"     ? style.failedRow :
                                                style.defaultRow
                                        }>
                                            <td>{course.course_id}</td>
                                            <td>{course.course_name}</td>
                                            <td>{course.course_units}</td>
                                            <td>{course.grade === null ? "-" : course.course_units}</td>
                                            <td>{course.grade ?? "-"}</td>
                                            <td>{course.remark}</td>
                                        </tr>
                                    );
                                });

                                return rows;
                            })()
                        )}
                    </tbody>
                </table>
                <button type="button" onClick={() => setShowModal(false)} style={{ marginTop: "20px" }}>Close</button>
            </div>
        </dialog>
    );
}