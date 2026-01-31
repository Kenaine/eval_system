import React, { useState } from "react";
import { FaPencilAlt, FaCheck } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import style from "../style/table.module.css";
import axios from "axios";

// 🔧 Helper function to add ordinal suffix to numbers (1 -> 1st, 2 -> 2nd, etc.)
function ordinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export default function CourseTable({ student_id, courses, role, onSelectStudent }) {
    const [editedCourse, setEditedCourse] = useState("");
    const [editIndex, setEditIndex] = useState(null);
    const [editedGrade, setEditedGrade] = useState("");
    const [editedRemark, setEditedRemark] = useState("");
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    const handleEditClick = (index, course_id, grade, remark) => {
        setEditIndex(index);
        setEditedCourse(course_id)
        setEditedGrade(grade ?? "");
        setEditedRemark(remark ? remark: "Passed");
    };

    const refreshStudentData = async () => {
        setShowBulkUpload(false);
        try{
            await onSelectStudent(student_id);
        }
        catch(err){
            console.error("Refreshing student data failed:", err);
        }
    };

    const handleSave = async () => {
        // Handle saving here
        //console.log("Saving grade:", editedGrade, "remark:", editedRemark);
        let gradeToSend = editedGrade
        
        if (!editedGrade || editedGrade === "-") {
            gradeToSend = "-1.0"
        }

        try{
            await axios.patch(`http://127.0.0.1:8000/SC/update-grade/${student_id}-${editedCourse}`,
                { grade: gradeToSend, remark: editedRemark },
                { withCredentials: true }
            )
        }
        catch(err){
            console.error("Editing failed: ", editedGrade);
        }

        courses[editIndex].grade = gradeToSend;
        courses[editIndex].remark = editedRemark;

        setEditedCourse("");
        setEditIndex(null);
    };

    return (
        <>
            <div className={style.tableHeader}>
                <h3>Curriculum Residency Evaluation</h3>
            </div>

            <div className={style.legendContainer}>
                <div className={style.legendItem}>
                    <div className={`${style.legendBox} ${style.passedBox}`}></div>
                    <span>Passed</span>
                </div>
                <div className={style.legendItem}>
                    <div className={`${style.legendBox} ${style.incompleteBox}`}></div>
                    <span>Incomplete</span>
                </div>
                <div className={style.legendItem}>
                    <div className={`${style.legendBox} ${style.failedBox}`}></div>
                    <span>Failed</span>
                </div>

                {role && role === "admin" && (
                    <button 
                        className={style.button} 
                        onClick={() => setShowBulkUpload(true)}
                        disabled={!student_id}
                    >
                        Bulk Upload Grades
                    </button>
                )}
            </div>

            {showBulkUpload && (
                <BulkGradeUpload 
                    student_id={student_id} 
                    onSuccess={() => refreshStudentData()}
                    onClose={() => setShowBulkUpload(false)}
                />
            )}

            <table className={style.tble}>
                <thead>
                    <tr>
                        <th>SUB CODE</th>
                        <th>SUB DESCRIPTION</th>
                        <th>TOTAL UNIT</th>
                        <th>CREDIT EARNED</th>
                        <th>GRADE</th>
                        <th>REMARK</th>
                        <th>EVALUATED</th>
                    </tr>
                </thead>
                <tbody>
                    {courses?.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center" }}>
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
                                            <td colSpan="7" style={{ fontWeight: "bold" }}>
                                                {ordinal(year)} Year, {ordinal(semester)} Sem
                                            </td>
                                        </tr>
                                    );
                                    prevYear = year;
                                    prevSem = semester;
                                }

                                const isEditing = editIndex === index;

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
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editedGrade}
                                                    onChange={(e) => setEditedGrade(e.target.value)}
                                                />
                                            ) : (
                                                course.grade ?? "-"
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <select
                                                    value={editedRemark}
                                                    onChange={(e) => setEditedRemark(e.target.value)}
                                                >
                                                    <option value="Passed">Passed</option>
                                                    <option value="Incomplete">Incomplete</option>
                                                    <option value="Failed">Failed</option>
                                                    <option value="N/A">N/A</option>
                                                </select>
                                            ) : (
                                                course.remark
                                            )}
                                        </td>
                                        <td style={{padding: "0"}}>
                                            {course.evaluated === false ?
                                                <FaCheck fill="#00a700" size={25}/> :
                                                <FaXmark fill="#ea0000" size={25}/>
                                            }
                                        </td>
                                        {isEditing && (
                                            <td>
                                                <button onClick={handleSave}>Save</button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            });

                            return rows;
                        })()
                    )}
                </tbody>
            </table>
        </>
    );
}

// Add this new component or update your existing one that handles grade editing

export function BulkGradeUpload({ student_id, onSuccess, onClose }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Disable scrolling when modal opens
    React.useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError("");
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a CSV file");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            await axios.post(
                `http://127.0.0.1:8000/SC/update-grades-bulk/${student_id}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    withCredentials: true,
                }
            );
            alert("Grades updated successfully!");
            setFile(null);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to upload grades");
            console.error("Upload failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={style.modalOverlay} onClick={onClose}>
            <div className={style.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2>Upload Grades</h2>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={loading}
                />
                <div className={style.modalButtons}>
                    <button onClick={handleUpload} disabled={loading || !file}>
                        {loading ? "Uploading..." : "Upload"}
                    </button>
                    <button onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                </div>
                {error && <span style={{ color: "red" }}>{error}</span>}
            </div>
        </div>
    );
}
