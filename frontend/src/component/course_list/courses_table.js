import React, { useState } from "react";
import style from "../../style/table.module.css";
import apiClient from "../../lib/api";

export default function CoursesTable({ courses, onCourseAdded }) {
    const [showModal, setShowModal] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [formData, setFormData] = useState({
        course_id: "",
        course_name: "",
        course_year: "",
        course_sem: "",
        hours_lec: "",
        hours_lab: "",
        units_lec: "",
        units_lab: "",
        course_preq: "",
        course_hours: 0,
        course_units: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const endpoint = editingCourseId ? `/course/edit/${editingCourseId}` : "/course/add";
        const method = editingCourseId ? "put" : "post";

        await apiClient({
            method,
            url: endpoint,
            data: formData
        })
        .then((res) => {
                setFormData({
                course_id: "",
                course_name: "",
                course_year: "",
                course_sem: "",
                hours_lec: "",
                hours_lab: "",
                units_lec: "",
                units_lab: "",
                course_preq: "",
                course_hours: 0,
                course_units: 0,
            });
            setShowModal(false);
            setEditingCourseId(null);
            if (onCourseAdded) {
                onCourseAdded();
            }
        })
        .catch((err) =>{
            setError(err.response?.data?.message || "Failed to save course");
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const handleEdit = (course) => {
        setEditingCourseId(course.course_id);
        setFormData(course);
        setShowModal(true);
    };

    const handleDelete = async (courseId) => {
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                await apiClient.delete(`/course/delete/${courseId}`);
                if (onCourseAdded) {
                    onCourseAdded();
                }
            } catch (err) {
                alert(err.response?.data?.message || "Failed to delete course");
            }
        }
    };

    return (
        <>
            <div className={style.tableHeader}>
                <h3>Courses</h3>
                <button onClick={() => setShowModal(true)} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
                    + Add Course
                </button>
            </div>

            <table className={style.tble}>
                <thead>
                    <tr>
                        <th rowSpan={2}>ID</th>
                        <th rowSpan={2}>Name</th>
                        <th rowSpan={2}>Year</th>
                        <th rowSpan={2}>Semester</th>
                        <th colSpan={2}>Hours</th>
                        <th colSpan={2}>Units</th>
                        <th rowSpan={2}>Prerequisite</th>
                        <th rowSpan={2}></th>
                        <th rowSpan={2}></th>
                    </tr>
                    <tr>
                        <th>Lec</th>
                        <th>Lab</th>
                        <th>Lec</th>
                        <th>Lab</th>
                    </tr>
                </thead>
                <tbody>
                    {courses?.length === 0 ? (
                        <tr>
                            <td colSpan="13" style={{ textAlign: "center" }}>
                                No courses found.
                            </td>
                        </tr>
                    ) : (
                        courses.map((course, index) => (
                            <tr key={index}>
                                <td>{course.course_id}</td>
                                <td>{course.course_name}</td>
                                <td>{course.course_year}</td>
                                <td>{course.course_sem}</td>
                                <td>{course.hours_lec || 0}</td>
                                <td>{course.hours_lab || 0}</td>
                                <td>{course.units_lec || 0}</td>
                                <td>{course.units_lab || 0}</td>
                                <td>{course.course_preq || "-"}</td>
                                <td>
                                    <button 
                                        onClick={() => handleEdit(course)}
                                        style={{ 
                                            background: "none", 
                                            border: "none", 
                                            cursor: "pointer", 
                                            fontSize: "1.2rem",
                                            color: "#4CAF50"
                                        }}
                                        title="Edit course"
                                    >
                                        ✏️
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        onClick={() => handleDelete(course.course_id)}
                                        style={{ 
                                            background: "none", 
                                            border: "none", 
                                            cursor: "pointer", 
                                            fontSize: "1.2rem",
                                            color: "#f44336"
                                        }}
                                        title="Delete course"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {showModal && (
                <div style={modalStyles.overlay}>
                    <div style={modalStyles.modal}>
                        <h3>{editingCourseId ? "Edit Course" : "Add New Course"}</h3>
                        {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
                        <form onSubmit={handleSubmit} style={modalStyles.form}>
                            <input
                                type="text"
                                name="course_id"
                                placeholder="Course ID"
                                value={formData.course_id}
                                onChange={handleChange}
                                disabled={editingCourseId !== null}
                                required
                            />
                            <input
                                type="text"
                                name="course_name"
                                placeholder="Course Name"
                                value={formData.course_name}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                name="course_year"
                                placeholder="Year"
                                value={formData.course_year}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                name="course_sem"
                                placeholder="Semester"
                                value={formData.course_sem}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                name="hours_lec"
                                placeholder="Hours (Lecture)"
                                value={formData.hours_lec}
                                onChange={handleChange}
                            />
                            <input
                                type="number"
                                name="hours_lab"
                                placeholder="Hours (Lab)"
                                value={formData.hours_lab}
                                onChange={handleChange}
                            />
                            <input
                                type="number"
                                name="units_lec"
                                placeholder="Units (Lecture)"
                                value={formData.units_lec}
                                onChange={handleChange}
                            />
                            <input
                                type="number"
                                name="units_lab"
                                placeholder="Units (Lab)"
                                value={formData.units_lab}
                                onChange={handleChange}
                            />
                            <input
                                type="text"
                                name="course_preq"
                                placeholder="Prerequisite"
                                value={formData.course_preq}
                                onChange={handleChange}
                            />
                            <div style={modalStyles.buttonGroup}>
                                <button type="submit" disabled={loading}>
                                    {loading ? (editingCourseId ? "Updating..." : "Adding...") : (editingCourseId ? "Update Course" : "Add Course")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingCourseId(null);
                                        setFormData({
                                            course_id: "",
                                            course_name: "",
                                            course_year: "",
                                            course_sem: "",
                                            hours_lec: "",
                                            hours_lab: "",
                                            units_lec: "",
                                            units_lab: "",
                                            course_preq: "",
                                            course_hours: 0,
                                            course_units: 0,
                                        });
                                    }}
                                    style={modalStyles.cancelBtn}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

const modalStyles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        maxWidth: "400px",
        width: "90%",
        maxHeight: "90vh",
        overflowY: "auto",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    buttonGroup: {
        display: "flex",
        gap: "0.5rem",
        marginTop: "1rem",
    },
    cancelBtn: {
        backgroundColor: "#f0f0f0",
        color: "#333",
    },
};
