import React, { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import style from "../style/table.module.css";
import axios from "axios";

import { API_URL } from "../misc/url";
import { isAdmin } from "../lib/auth";

function getApiErrorMessage(err, fallback = "Something went wrong") {
    const detail = err?.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
        return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
        return detail
            .map((item) => item?.msg || JSON.stringify(item))
            .join("; ");
    }

    if (detail && typeof detail === "object") {
        return detail.message || detail.msg || JSON.stringify(detail);
    }

    return fallback;
}

// 🔧 Helper function to add ordinal suffix to numbers (1 -> 1st, 2 -> 2nd, etc.)
function ordinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export default function CourseTable({ student_id, courses, role, onSelectStudent }) {
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [isEditGradesMode, setIsEditGradesMode] = useState(false);
    const [draftCourses, setDraftCourses] = useState([]);
    const [isSavingGrades, setIsSavingGrades] = useState(false);

    useEffect(() => {
        if (!isEditGradesMode) {
            setDraftCourses(courses || []);
        }
    }, [courses, isEditGradesMode]);

    const refreshStudentData = async () => {
        setShowBulkUpload(false);
        try{
            await onSelectStudent(student_id);
        }
        catch(err){
            console.error("Refreshing student data failed:", err);
        }
    };

    const normalizeGradeForCompare = (value) => {
        const raw = String(value ?? "").trim();
        if (raw === "" || raw === "-") {
            return null;
        }

        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
            return raw;
        }

        if (parsed === -1) {
            return null;
        }

        return Number(parsed.toFixed(2));
    };

    const deriveRemarkFromGrade = (value) => {
        const raw = String(value ?? "").trim();
        if (raw === "" || raw === "-") {
            return "N/A";
        }

        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
            return "N/A";
        }

        return parsed >= 75 ? "Passed" : "Failed";
    };

    const isValidGrade = (value) => {
        const raw = String(value ?? "").trim();
        if (raw === "" || raw === "-") {
            return true;
        }

        if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
            return false;
        }

        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
            return false;
        }

        return parsed >= 0 && parsed <= 100;
    };

    const toApiGrade = (value) => {
        const raw = String(value ?? "").trim();
        if (raw === "" || raw === "-") {
            return null;
        }
        return Number(raw);
    };

    const handleGradeChange = (courseId, value) => {
        setDraftCourses((prev) =>
            prev.map((course) =>
                course.course_id === courseId ? { ...course, grade: value } : course
            )
        );
    };

    const handleIncompleteToggle = (courseId, checked) => {
        setDraftCourses((prev) =>
            prev.map((course) =>
                course.course_id === courseId
                    ? { ...course, forceIncomplete: checked, grade: checked ? "" : course.grade }
                    : course
            )
        );
    };

    const toggleEditGrades = async () => {
        if (!student_id) {
            return;
        }

        if (!isEditGradesMode) {
            setDraftCourses((courses || []).map((course) => ({
                ...course,
                grade: course.grade ?? "",
                remark: course.remark ?? "N/A",
                forceIncomplete: String(course.remark || "").toLowerCase() === "incomplete"
            })));
            setIsEditGradesMode(true);
            return;
        }

        const originalByCourseId = new Map((courses || []).map((course) => [course.course_id, course]));
        const changedCourses = (draftCourses || []).filter((course) => {
            const original = originalByCourseId.get(course.course_id);
            if (!original) return false;

            const originalIncomplete = String(original.remark || "").toLowerCase() === "incomplete";
            const currentIncomplete = course.forceIncomplete === true;

            return (
                normalizeGradeForCompare(original.grade) !== normalizeGradeForCompare(course.grade) ||
                originalIncomplete !== currentIncomplete
            );
        });

        const invalidCourse = changedCourses.find((course) => course.forceIncomplete !== true && !isValidGrade(course.grade));
        if (invalidCourse) {
            alert(`Invalid grade for ${invalidCourse.course_id}. Use values from 0 to 100 only.`);
            return;
        }

        if (changedCourses.length === 0) {
            setIsEditGradesMode(false);
            return;
        }

        setIsSavingGrades(true);
        try {
            for (const course of changedCourses) {
                await axios.patch(
                    API_URL + `/SC/update-grade/${student_id}-${course.course_id}`,
                    {
                        grade: course.forceIncomplete ? null : toApiGrade(course.grade),
                        remark: course.forceIncomplete ? "Incomplete" : deriveRemarkFromGrade(course.grade),
                        force_incomplete: course.forceIncomplete === true
                    },
                    { withCredentials: true }
                );
            }

            setIsEditGradesMode(false);
            await refreshStudentData();
        } catch (err) {
            console.error("Saving edited grades failed:", err);
            alert(getApiErrorMessage(err, "Failed to save edited grades"));
        } finally {
            setIsSavingGrades(false);
        }
    };

    const displayedCourses = isEditGradesMode ? draftCourses : courses;

    return (
        <>
            <div className={style.tableHeader}>
                <h3>Student Evaluation</h3>
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

                {isAdmin(role) && (
                    <div className={style.printHideActions} style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                        <button
                            className={style.button}
                            style={{ marginLeft: 0 }}
                            onClick={toggleEditGrades}
                            disabled={!student_id || isSavingGrades}
                        >
                            {isSavingGrades ? "Saving..." : "Edit Grades"}
                        </button>
                        <button 
                            className={style.button}
                            style={{ marginLeft: 0 }}
                            onClick={() => setShowBulkUpload(true)}
                            disabled={!student_id || isEditGradesMode || isSavingGrades}
                        >
                            Bulk Upload Grades
                        </button>
                    </div>
                )}
            </div>

            {showBulkUpload && (
                <BulkGradeUpload 
                    student_id={student_id}
                    courses={courses}
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
                    {displayedCourses?.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center" }}>
                                No courses found.
                            </td>
                        </tr>
                    ) : (
                        (() => {
                            const sorted = [...displayedCourses].sort((a, b) =>
                                a.year !== b.year ? a.year - b.year : a.semester - b.semester
                            );

                            const rows = [];
                            let prevYear = null;
                            let prevSem = null;

                            sorted.forEach((course, index) => {
                                const { year, semester } = course;
                                const effectiveRemark = isEditGradesMode
                                    ? (course.forceIncomplete ? "Incomplete" : deriveRemarkFromGrade(course.grade))
                                    : course.remark;

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

                                rows.push(
                                    <tr key={index} className={
                                            effectiveRemark === "Passed"     ? style.passedRow :
                                            effectiveRemark === "Incomplete" ? style.incompleteRow :
                                            effectiveRemark === "Failed"     ? style.failedRow :
                                            style.defaultRow
                                    }>
                                        <td>{course.course_id}</td>
                                        <td>
                                            <span className={style.printOnlyInline}>
                                                {ordinal(year)} Year, {ordinal(semester)} Sem — 
                                            </span>
                                            {course.course_name}
                                        </td>
                                        <td>{course.course_units}</td>
                                        <td>{effectiveRemark === "Passed" ? course.course_units : "-"}</td>
                                        <td>
                                            {isEditGradesMode ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={course.grade ?? ""}
                                                    disabled={course.forceIncomplete === true}
                                                    onChange={(e) => handleGradeChange(course.course_id, e.target.value)}
                                                    tabIndex="0"
                                                    style={{width:"75px"}}
                                                />
                                            ) : (
                                                course.grade ? course.grade : "-"
                                            )}
                                        </td>
                                        <td>
                                            {isEditGradesMode ? (
                                                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={course.forceIncomplete === true}
                                                        onChange={(e) => handleIncompleteToggle(course.course_id, e.target.checked)}
                                                        tabIndex="-1"
                                                    />
                                                    <span>{effectiveRemark}</span>
                                                </label>
                                            ) : (
                                                effectiveRemark
                                            )}
                                        </td>
                                        <td style={{padding: "0"}}>
                                            {course.evaluated === true ?
                                                <FaCheck fill="#00a700" size={25} title="Evaluated" /> :
                                                <FaXmark fill="#ea0000" size={25} title="Not Evaluated" />
                                            }
                                        </td>
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

export function BulkGradeUpload({ student_id, courses, onSuccess, onClose }) {
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

    const handleDownloadTemplate = () => {
        if (!courses || courses.length === 0) {
            setError("No courses available to generate template");
            return;
        }

        // Create CSV content
        const headers = "course_id,grade";
        const rows = courses.map(course => `${course.course_id},`).join("\n");
        const csvContent = `${headers}\n${rows}`;

        // Create a blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", "grades_template.csv");
        link.style.visibility = "hidden";
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                API_URL + `/SC/update-grades-bulk/${student_id}`,
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
            setError(getApiErrorMessage(err, "Failed to upload grades"));
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
                <button 
                    onClick={handleDownloadTemplate} 
                    disabled={loading || !courses || courses.length === 0}
                    style={{ marginTop: "10px", width: "100%" }}
                >
                    Download Template
                </button>
                {error && <span style={{ color: "red" }}>{error}</span>}
            </div>
        </div>
    );
}
