import React, {useState} from "react";

export default function AddCourseModal({allCourses, handleAddCourse, setShowAddModal}){
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedYear, setSelectedYear] = useState(1);
    const [selectedSem, setSelectedSem] = useState(1);

    function addCourse(){
        handleAddCourse(selectedCourseId, selectedYear, selectedSem);
        setSelectedCourseId("");
        setSelectedYear(1);
        setSelectedSem(1);
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
                maxWidth: "500px",
                width: "90%",
            }}>
                <h2>Add Course</h2>
                
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
                        onClick={addCourse}
                        style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
