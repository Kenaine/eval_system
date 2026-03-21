import React, {useState} from "react";

export default function AddCourseModal({allCourses, handleAddCourse, setShowAddModal}){
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedYear, setSelectedYear] = useState(1);
    const [selectedSem, setSelectedSem] = useState(1);
    const [coursesToAdd, setCoursesToAdd] = useState([]);

    function addToList(){
        if (!selectedCourseId) return;
        
        const course = allCourses.find(c => c.course_id === selectedCourseId);
        if (!course) return;

        // Check if course already in list for this year/semester
        const exists = coursesToAdd.some(
            c => c.course_id === selectedCourseId && c.year === selectedYear && c.semester === selectedSem
        );
        
        if (exists) {
            alert("This course is already in the list for this year and semester!");
            return;
        }

        setCoursesToAdd([
            ...coursesToAdd,
            {
                course_id: selectedCourseId,
                course_name: course.course_name,
                year: selectedYear,
                semester: selectedSem,
            }
        ]);
        
        setSelectedCourseId("");
        setSelectedYear(1);
        setSelectedSem(1);
    }

    function removeFromList(index){
        setCoursesToAdd(coursesToAdd.filter((_, i) => i !== index));
    }

    async function addAllCourses(){
        if (coursesToAdd.length === 0) return;
        
        const newCourses = [];
        for (const course of coursesToAdd) {
            const result = await handleAddCourse(course.course_id, course.year, course.semester, newCourses);
            if (result) {
                newCourses.push(result);
            } else {
                alert("Failed to add course: " + course.course_id);
                return; // Stop on error
            }
        }
        
        // Update parent state with all new courses at once
        window.dispatchEvent(new CustomEvent('coursesAdded', { detail: newCourses }));
        
        setCoursesToAdd([]);
        setShowAddModal(false);
    }
    
    return(
        <div style={{
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
        }}>
            <div style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "8px",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
            }}>
                <h2 style={{ marginTop: 0 }}>Add Courses</h2>
                
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        Select Course:
                    </label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            fontSize: "1rem",
                        }}
                    >
                        <option value="">-- Choose a course --</option>
                        {allCourses.map((course) => (
                            <option key={course.course_id} value={course.course_id}>
                                {course.course_id} - {course.course_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                            Year:
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                fontSize: "1rem",
                            }}
                        >
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                        </select>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                            Semester:
                        </label>
                        <select
                            value={selectedSem}
                            onChange={(e) => setSelectedSem(parseInt(e.target.value))}
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                fontSize: "1rem",
                            }}
                        >
                            <option value={1}>1st Semester</option>
                            <option value={2}>2nd Semester</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={addToList}
                    disabled={!selectedCourseId}
                    style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: selectedCourseId ? "#2196F3" : "#cccccc",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: selectedCourseId ? "pointer" : "not-allowed",
                        fontSize: "1rem",
                        marginBottom: "1rem",
                    }}
                >
                    + Add to List
                </button>

                {/* Selected Courses List */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    minHeight: "150px",
                    backgroundColor: "#f9f9f9",
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>
                        Selected Courses ({coursesToAdd.length})
                    </h3>
                    {coursesToAdd.length === 0 ? (
                        <p style={{ color: "#999", margin: 0 }}>No courses selected yet</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {coursesToAdd.map((course, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "0.75rem",
                                        backgroundColor: "white",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "4px",
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontWeight: "bold" }}>{course.course_id}</span>
                                        <span style={{ marginLeft: "0.5rem", color: "#666" }}>
                                            {course.course_name}
                                        </span>
                                        <div style={{ fontSize: "0.85rem", color: "#999", marginTop: "0.25rem" }}>
                                            Year {course.year}, Sem {course.semester}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromList(index)}
                                        style={{
                                            padding: "0.3rem 0.6rem",
                                            backgroundColor: "#f44336",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "3px",
                                            cursor: "pointer",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                    <button
                        onClick={() => setShowAddModal(false)}
                        style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={addAllCourses}
                        disabled={coursesToAdd.length === 0}
                        style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: coursesToAdd.length > 0 ? "#4CAF50" : "#cccccc",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: coursesToAdd.length > 0 ? "pointer" : "not-allowed",
                            fontSize: "1rem",
                        }}
                    >
                        Add All Courses
                    </button>
                </div>
            </div>
        </div>
    );
}
