import React, { useEffect, useRef, useState } from "react";
import apiClient from "../lib/api";

import style from "../style/checklist.module.css";

import HeaderWebsite from "../component/header";
import CourseTable from "../component/curriculum_list/course_table";
import AddCurriculumModal from "../component/curriculum_list/addCurriculum_modal";
import AddProgramModal from "../component/curriculum_list/addProgram_modal";
import AddCourseModal from "../component/curriculum_list/addCourse_modal";

export default function CurriculumList() {
    const pageName = "Curriculum List";
    const CURRICULUM_VIEW_KEY = "curriculum_list_view_state";
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState("");
    const [curriculums, setCurriculums] = useState([]);
    const [selectedCurriculum, setSelectedCurriculum] = useState("");
    const [courses, setCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddProgramModal, setShowAddProgramModal] = useState(false);
    const [showAddCurriculumModal, setShowAddCurriculumModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [showUnarchiveConfirm, setShowUnarchiveConfirm] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const hasRestoredView = useRef(false);

    const loadCurriculumsForProgram = async (programId) => {
        if (!programId) {
            setCurriculums([]);
            return [];
        }

        try {
            const res = await apiClient.get(`/curriculum/get/${programId}`);
            const data = res.data || [];
            setCurriculums(data);
            return data;
        } catch (err) {
            console.error("Failed to load curriculums:", err);
            setCurriculums([]);
            return [];
        }
    };

    const loadCoursesForCurriculum = async (programId, curriculumName) => {
        if (!programId || !curriculumName) {
            setCourses([]);
            return [];
        }

        try {
            const res = await apiClient.get(`/currCourse/get_courses`, {
                params: {
                    program: programId,
                    curriculum: curriculumName
                }
            });
            const data = res.data || [];
            setCourses(data);
            return data;
        } catch (err) {
            console.error("Failed to load courses:", err);
            setCourses([]);
            return [];
        }
    };

    useEffect(() => {
        const prgms = JSON.parse(sessionStorage.getItem("programs"));
        setPrograms(prgms || [])
    }, []);

    useEffect(() => {
        if (!hasRestoredView.current) {
            return;
        }

        if (selectedProgram && selectedCurriculum) {
            sessionStorage.setItem(
                CURRICULUM_VIEW_KEY,
                JSON.stringify({
                    selectedProgram,
                    selectedCurriculum,
                    showArchived
                })
            );
            return;
        }

        sessionStorage.removeItem(CURRICULUM_VIEW_KEY);
    }, [selectedProgram, selectedCurriculum, showArchived]);

    useEffect(() => {
        const restoreView = async () => {
            if (hasRestoredView.current) {
                return;
            }

            const rawView = sessionStorage.getItem(CURRICULUM_VIEW_KEY);
            if (!rawView) {
                hasRestoredView.current = true;
                return;
            }

            try {
                const savedView = JSON.parse(rawView);
                const savedProgram = savedView?.selectedProgram || "";
                const savedCurriculum = savedView?.selectedCurriculum || "";
                const savedShowArchived = savedView?.showArchived === true;

                if (savedShowArchived) {
                    await apiClient.put(`/curriculum/toggleArchive`);
                    setShowArchived(true);
                }

                if (savedProgram) {
                    setSelectedProgram(savedProgram);
                    const loadedCurriculums = await loadCurriculumsForProgram(savedProgram);

                    if (savedCurriculum && loadedCurriculums.some((curriculum) => curriculum.name === savedCurriculum)) {
                        setSelectedCurriculum(savedCurriculum);
                        await loadCoursesForCurriculum(savedProgram, savedCurriculum);
                    }
                }
            } catch (err) {
                console.error("Failed to restore curriculum list view:", err);
            } finally {
                hasRestoredView.current = true;
            }
        };

        restoreView();
    }, []);

    useEffect(() => {
        // Listen for batch course additions
        const handleCoursesAdded = (event) => {
            setCourses([...courses, ...event.detail]);
        };
        
        window.addEventListener('coursesAdded', handleCoursesAdded);
        return () => window.removeEventListener('coursesAdded', handleCoursesAdded);
    }, [courses]);

    const toggleArchiveFilter = async () => {
        try {
            await apiClient.put(`/curriculum/toggleArchive`);
            setShowArchived(!showArchived);
            setSelectedCurriculum("");
            setCourses([]);
            
            // Refresh curriculums if a program is selected
            if (selectedProgram) {
                const res = await apiClient.get(`/curriculum/get/${selectedProgram}`);
                setCurriculums(res.data);
            }
        } catch (err) {
            console.error("Failed to toggle archive filter:", err);
            alert("Failed to toggle archive filter");
        }
    };

    const handleProgramChange = async (e) => {
        const programId = e.target.value;
        setSelectedProgram(programId);
        setSelectedCurriculum("");
        setCourses([]);

        if (programId === "") {
            setCurriculums([]);
            return;
        }

        await loadCurriculumsForProgram(programId);
        
    };

    const handleCurriculumChange = async (e) => {
        const curriculumName = e.target.value;
        setSelectedCurriculum(curriculumName);

        if(curriculumName === "") {
            setCourses([]);
            return;
        }

        await loadCoursesForCurriculum(selectedProgram, curriculumName);
    };

    const fetchAllCourses = async () => {
        try {
            const res = await apiClient.get(`/course/getAll`);
            console.log(res.data);
            setAllCourses(res.data);
        } catch (err) {
            console.error("Failed to fetch courses:", err);
        }
    };

    const handleAddCourseClick = () => {
        if (!allCourses.length) {
            fetchAllCourses();
        }
        setShowAddModal(true);
    };

    const handleAddCourse = async (selectedCourseId, selectedYear, selectedSem, currentCourses = null) => {
        if (!selectedCourseId) {
            alert("Please select a course");
            return null;
        }

        const selectedCourse = allCourses.find((c) => c.course_id === selectedCourseId);
        if (!selectedCourse) {
            alert("Invalid course selection");
            return null;
        }

        // Use provided courses list for sequence calculation, or fall back to state
        const coursesToCheck = currentCourses !== null ? currentCourses : courses;
        // Calculate sequence: find max sequence in the selected year/sem
        const coursesInYearSem = coursesToCheck.filter(
            (c) => c.course_year === selectedYear && c.course_sem === selectedSem
        );
        const maxSequence =
            coursesInYearSem.length > 0
                ? Math.max(...coursesInYearSem.map((c) => c.sequence || 0))
                : 0;
        const newSequence = maxSequence + 1;

        try {
            const newCourseData = {
                course_id: selectedCourse.course_id,
                course_name: selectedCourse.course_name,
                course_year: selectedYear,
                course_sem: selectedSem,
                course_hours: selectedCourse.course_hours || 0,
                course_units: selectedCourse.course_units || 0,
                course_preq: selectedCourse.course_preq || "None",
                hours_lec: selectedCourse.hours_lec || 0,
                hours_lab: selectedCourse.hours_lab || 0,
                units_lec: selectedCourse.units_lec || 0,
                units_lab: selectedCourse.units_lab || 0,
                sequence: newSequence,
                curriculum: selectedCurriculum,
                program_id: selectedProgram
            };

            await apiClient.post(`/currCourse/add-course`, newCourseData);
            return newCourseData;
        } catch (err) {
            console.error("Failed to add course:", err);
            alert("Failed to add course: ", err);
            return null;
        }
    };

    const handleDeleteCourse = async (courseId, curriculum) => {
        try {
            await apiClient.post(`/currCourse/delete-course`, {
                course_id: courseId,
                curriculum: curriculum,
                program_id: selectedProgram
            });
            setCourses(courses.filter((c) => c.course_id !== courseId));
        } catch (err) {
            console.error("Failed to delete course:", err);
            alert("Failed to delete course");
        }
    };

    const handleAddProgram = async (newProgramName, newProgramID, newSpecialization) => {
        if (!newProgramName.trim()) {
            alert("Please enter a program name");
            return;
        }

        try {
            const response = await apiClient.post(`/program/add`, {
                name: newProgramName.trim(),
                program_id: newProgramID.trim(),
                specialization: newSpecialization.trim()
            });
            
            const updatedPrograms = [...programs, response.data];
            setPrograms(updatedPrograms);
            sessionStorage.setItem("programs", JSON.stringify(updatedPrograms));
            
            setShowAddProgramModal(false);
            alert("Program added successfully");
        } catch (err) {
            console.error("Failed to add program:", err);
            alert("Failed to add program");
        }
    };

    const handleAddCurriculum = async (newCurriculumName) => {
        if (!newCurriculumName.trim()) {
            alert("Please enter a curriculum name");
            return;
        }

        try {
            await apiClient.post(`/curriculum/add`, {
                name: newCurriculumName.trim(),
                program_id: selectedProgram
            });
            
            const updatedCurriculums = [...curriculums, { name: newCurriculumName.trim() }];
            setCurriculums(updatedCurriculums);
            
            setShowAddCurriculumModal(false);
            alert("Curriculum added successfully");
        } catch (err) {
            console.error("Failed to add curriculum:", err);
            alert("Failed to add curriculum");
        }
    };

    const handleDeleteCurriculum = async () => {
        if (!selectedCurriculum) {
            alert("Please select a curriculum to delete");
            return;
        }

        try {
            await apiClient.delete(`/curriculum/delete`, {
                data: {
                    name: selectedCurriculum.trim(),
                    program_id: selectedProgram
                }
            });
            
            const updatedCurriculums = curriculums.filter((c) => c.name !== selectedCurriculum);
            setCurriculums(updatedCurriculums);
            setSelectedCurriculum("");
            setCourses([]);
            
            setShowDeleteConfirm(false);
            alert("Curriculum deleted successfully");
        } catch (err) {
            console.error("Failed to delete curriculum:", err);
            alert("Failed to delete curriculum");
        }
    };

    const handleArchiveCurriculum = async () => {
        if (!selectedCurriculum) {
            alert("Please select a curriculum to archive");
            return;
        }

        try {
            await apiClient.patch(`/curriculum/archive`, {
                name: selectedCurriculum,
                program_id: selectedProgram
            });
            
            const updatedCurriculums = curriculums.filter((c) => c.name !== selectedCurriculum);
            setCurriculums(updatedCurriculums);
            setSelectedCurriculum("");
            setCourses([]);
            
            setShowArchiveConfirm(false);
            alert("Curriculum archived successfully");
        } catch (err) {
            console.error("Failed to archive curriculum:", err);
            alert("Failed to archive curriculum");
        }
    };

    const handleUnarchiveCurriculum = async () => {
        if (!selectedCurriculum) {
            alert("Please select a curriculum to unarchive");
            return;
        }

        try {
            await apiClient.patch(`/curriculum/unarchive`, {
                name: selectedCurriculum,
                program_id: selectedProgram
            });
            
            const updatedCurriculums = curriculums.filter((c) => c.name !== selectedCurriculum);
            setCurriculums(updatedCurriculums);
            setSelectedCurriculum("");
            setCourses([]);
            
            setShowUnarchiveConfirm(false);
            alert("Curriculum unarchived successfully");
        } catch (err) {
            console.error("Failed to unarchive curriculum:", err);
            alert("Failed to unarchive curriculum");
        }
    };

    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />

            <div className={style.curriculumBody}>
                <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginBottom: "0.5rem" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                                Select Program:
                            </label>
                            <select 
                                value={selectedProgram} 
                                onChange={handleProgramChange}
                                style={{
                                    padding: "0.5rem",
                                    fontSize: "1rem",
                                    width: "100%",
                                    maxWidth: "300px"
                                }}
                            >
                                <option value="">-- Choose a program --</option>
                                {programs.map((program) => (
                                    <option key={program.program_id} value={program.program_id}>
                                        {program.program_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => setShowAddProgramModal(true)}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#2196F3",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "1rem",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Add Program
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                                Select Curriculum:
                            </label>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <select 
                                    value={selectedCurriculum} 
                                    onChange={handleCurriculumChange}
                                    disabled={!selectedProgram}
                                    style={{
                                        padding: "0.5rem",
                                        fontSize: "1rem",
                                        width: "100%",
                                        maxWidth: "300px",
                                        backgroundColor: !selectedProgram ? "#f0f0f0" : "white",
                                        cursor: !selectedProgram ? "not-allowed" : "pointer",
                                        opacity: !selectedProgram ? 0.6 : 1,
                                    }}
                                >
                                    <option value="">-- Choose a curriculum --</option>
                                    {curriculums.map((curriculum) => (
                                        <option key={curriculum.name} value={curriculum.name}>
                                            {curriculum.name}
                                        </option>
                                    ))}
                                </select>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap", marginBottom: 0 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={showArchived} 
                                        onChange={toggleArchiveFilter}
                                        style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                    />
                                    <span>Show Archived</span>
                                </label>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddCurriculumModal(true)}
                            disabled={!selectedProgram}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: selectedProgram ? "#FF9800" : "#cccccc",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: selectedProgram ? "pointer" : "not-allowed",
                                fontSize: "1rem",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Create Curriculum
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={!selectedCurriculum}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: selectedCurriculum ? "#f44336" : "#cccccc",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: selectedCurriculum ? "pointer" : "not-allowed",
                                fontSize: "1rem",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Delete Curriculum
                        </button>
                        <button
                            onClick={() => setShowArchiveConfirm(true)}
                            disabled={!selectedCurriculum}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: selectedCurriculum ? "#9C27B0" : "#cccccc",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: selectedCurriculum ? "pointer" : "not-allowed",
                                fontSize: "1rem",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Archive Curriculum
                        </button>
                        <button
                            onClick={() => setShowUnarchiveConfirm(true)}
                            disabled={!selectedCurriculum}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: selectedCurriculum ? "#00BCD4" : "#cccccc",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: selectedCurriculum ? "pointer" : "not-allowed",
                                fontSize: "1rem",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Unarchive Curriculum
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: "2rem" }}>
                    <h3>Courses</h3>
                    <button
                        onClick={handleAddCourseClick}
                        disabled={!selectedCurriculum}
                        style={{
                            padding: "0.5rem 1rem",
                            marginBottom: "1rem",
                            backgroundColor: selectedCurriculum ? "#4CAF50" : "#cccccc",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: selectedCurriculum ? "pointer" : "not-allowed",
                            fontSize: "1rem",
                        }}
                    >
                        Add Course
                    </button>
                    <CourseTable 
                        courses={courses} 
                        onReorder={setCourses}
                        curriculum={selectedCurriculum}
                        programId={selectedProgram}
                        onDelete={handleDeleteCourse}
                    />
                </div>

                {showAddModal && (
                    <AddCourseModal allCourses={allCourses} handleAddCourse={handleAddCourse}
                    setShowAddModal={setShowAddModal}/>  
                )}

                {showAddProgramModal && (
                    <AddProgramModal handleAddProgram={handleAddProgram} setShowAddProgramModal={setShowAddProgramModal}/>
                )}

                {showAddCurriculumModal && (
                    <AddCurriculumModal programs={programs} selectedProgram={selectedProgram} 
                    handleAddCurriculum={handleAddCurriculum} setShowAddCurriculumModal={setShowAddCurriculumModal}/>
                )}

                {showDeleteConfirm && (
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
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            padding: "2rem",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            textAlign: "center",
                            maxWidth: "400px"
                        }}>
                            <h2 style={{ marginBottom: "1rem", color: "#f44336" }}>Delete Curriculum</h2>
                            <p style={{ marginBottom: "1.5rem", color: "#666" }}>
                                Are you sure you want to delete the curriculum "<strong>{selectedCurriculum}</strong>"? This action cannot be undone.
                            </p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{
                                        padding: "0.5rem 1.5rem",
                                        backgroundColor: "#ccc",
                                        color: "#333",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "1rem"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCurriculum}
                                    style={{
                                        padding: "0.5rem 1.5rem",
                                        backgroundColor: "#f44336",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "1rem"
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showArchiveConfirm && (
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
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            padding: "2rem",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            textAlign: "center",
                            maxWidth: "400px"
                        }}>
                            <h2 style={{ marginBottom: "1rem", color: "#9C27B0" }}>Archive Curriculum</h2>
                            <p style={{ marginBottom: "1.5rem", color: "#666" }}>
                                Are you sure you want to archive the curriculum "<strong>{selectedCurriculum}</strong>"? You can restore it later if needed.
                            </p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                                <button
                                    onClick={() => setShowArchiveConfirm(false)}
                                    style={{
                                        padding: "0.5rem 1.5rem",
                                        backgroundColor: "#ccc",
                                        color: "#333",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "1rem"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleArchiveCurriculum}
                                    style={{
                                        padding: "0.5rem 1.5rem",
                                        backgroundColor: "#9C27B0",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "1rem"
                                    }}
                                >
                                    Archive
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showUnarchiveConfirm && (
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
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            padding: "2rem",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            textAlign: "center",
                            maxWidth: "400px"
                        }}>
                            <h2 style={{ marginBottom: "1rem", color: "#00BCD4" }}>Unarchive Curriculum</h2>
                            <p style={{ marginBottom: "1.5rem", color: "#666" }}>
                                Are you sure you want to unarchive the curriculum "<strong>{selectedCurriculum}</strong>"? It will be available again.
                            </p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                                <button
                                    onClick={() => setShowUnarchiveConfirm(false)}
                                    style={{
                                        padding: "0.5rem 1.5rem",
                                        backgroundColor: "#ccc",
                                        color: "#333",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "1rem"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUnarchiveCurriculum}
                                    style={{
                                        padding: "0.5rem 1.5rem",
                                        backgroundColor: "#00BCD4",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "1rem"
                                    }}
                                >
                                    Yes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
