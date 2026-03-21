import React, { useEffect, useState } from "react";
import apiClient from "../lib/api";

import style from "../style/checklist.module.css";

import HeaderWebsite from "../component/header";
import CourseTable from "../component/curriculum_list/course_table";
import AddCurriculumModal from "../component/curriculum_list/addCurriculum_modal";
import AddProgramModal from "../component/curriculum_list/addProgram_modal";
import AddCourseModal from "../component/curriculum_list/addCourse_modal";

export default function CurriculumList() {
    const pageName = "Curriculum List";
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState("");
    const [curriculums, setCurriculums] = useState([]);
    const [selectedCurriculum, setSelectedCurriculum] = useState("");
    const [courses, setCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddProgramModal, setShowAddProgramModal] = useState(false);
    const [showAddCurriculumModal, setShowAddCurriculumModal] = useState(false);

    useEffect(() => {
        const prgms = JSON.parse(sessionStorage.getItem("programs"));
        setPrograms(prgms || [])
    }, []);

    const handleProgramChange = async (e) => {
        const programId = e.target.value;
        setSelectedProgram(programId);
        setSelectedCurriculum("");

        if (programId === "") {
            return;
        }
        
        await apiClient.get(`/curriculum/get/${programId}`)
        .then((res) =>{
            setCurriculums(res.data);
        });
        
    };

    const handleCurriculumChange = async (e) => {
        setSelectedCurriculum(e.target.value);

        if(e.target.value === "")
            return;

        await apiClient.get(`/currCourse/get_courses`, {
            params: {
                program: selectedProgram,
                curriculum: e.target.value
            }
        })
        .then((res) => {
            console.log(res.data);
            setCourses(res.data);
        });
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

    const handleAddCourse = async (selectedCourseId, selectedYear, selectedSem) => {
        if (!selectedCourseId) {
            alert("Please select a course");
            return;
        }

        const selectedCourse = allCourses.find((c) => c.course_id === selectedCourseId);
        if (!selectedCourse) {
            alert("Invalid course selection");
            return;
        }

        // Calculate sequence: find max sequence in the selected year/sem
        const coursesInYearSem = courses.filter(
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
            };

            await apiClient.post(`/currCourse/add-course`, newCourseData);
            setCourses([...courses, newCourseData]);
            
            setShowAddModal(false);
        } catch (err) {
            console.error("Failed to add course:", err);
            alert("Failed to add course");
        }
    };

    const handleDeleteCourse = async (courseId, curriculum) => {
        try {
            await apiClient.post(`/currCourse/delete-course`, {
                course_id: courseId,
                curriculum: curriculum
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

    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />

            <div style={{ padding: "2rem" }}>
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
            </div>
        </div>
    );
}
