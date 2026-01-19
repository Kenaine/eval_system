import React, { useEffect, useRef, useState } from "react";
import { FaPencilAlt, FaPrint } from "react-icons/fa";
import style from "../style/programlist.module.css";
import HeaderWebsite from "../component/header";
import ProgramTable from "../component/program_table";
import LoadingOverlay from "../component/loadingOverlay";
import axios from "axios";

import { useUser } from "../App";

export default function ProgramCourseList() {
  const pageName = "PROGRAM COURSELIST";

  const [programs, setPrograms] = useState([]);
  const [program_id, setProgram] = useState("");
  const [courses, setCourses] = useState([]);
  const [originalCourses, setOriginalCourses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);

  const printRef = useRef();


  useEffect(() => {
    const programs = JSON.parse(sessionStorage.getItem("programs"));

    setPrograms(programs);
  }, []);

  const getCourses = async (program_id) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/course/get/${program_id}`, { withCredentials: true });
      const mapped = res.data.map((c, idx) => ({
        ...c,
        hours_lec: c.hours_lec ?? 0,
        hours_lab: c.hours_lab ?? 0,
        units_lec: c.units_lec ?? 0,
        units_lab: c.units_lab ?? 0,
        sequence: c.sequence ?? (idx + 1),
      }));
      setCourses(mapped);
      setOriginalCourses(mapped);
    } catch (err) {
      console.error("Getting Course failed: ", err);
    }
  };

  const handleProgramChange = (e) => {
    const newValue = e.target.value.trim();
    setProgram(newValue);
    setIsEditing(false);
    setEditingRowId(null);
    if (newValue === "") {
      setCourses([]);
      setOriginalCourses([]);
    } else {
      getCourses(newValue);
    }
  };

  const startEditing = () => {
    if (!program_id) return;
    setOriginalCourses(courses);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setCourses(originalCourses);
    setIsEditing(false);
    setIsAdding(false);
    setEditingRowId(null);
  };

  const saveEditing = async () => {
    setIsUpdating(true);
    document.body.style.cursor = "wait";
    document.body.style.pointerEvents = "none";
    document.body.style.overflow = "hidden";
    try {
      const payload = courses.map((c) => {
        const isLab = c.course_id.trim().toLowerCase().endsWith("l");
        return {
          ...c,
          hours_lec: isLab ? 0 : c.course_hours,
          hours_lab: isLab ? c.course_hours : 0,
          units_lec: isLab ? 0 : c.course_units,
          units_lab: isLab ? c.course_units : 0,
          sequence: c.sequence,
        };
      });

      await axios.put(`http://127.0.0.1:8000/course/update/${program_id}`, payload, { withCredentials: true });

      setOriginalCourses(courses);
      setIsEditing(false);
      setEditingRowId(null);
    } catch (err) {
      console.error("Failed to save courses", err);
    }

    document.body.style.cursor = "default";
    document.body.style.pointerEvents = "auto";
    document.body.style.overflow = "auto";
    setIsUpdating(false);
  };

  const handlePrint = () => {
    window.print()
  };

  return (
    <div className={style.programChecklist}>
      {isUpdating && <LoadingOverlay /> }

      <HeaderWebsite pageName={pageName} />
      <div className={style.courseBody} ref={printRef}>
        <select
          name="program_id"
          value={program_id}
          onChange={handleProgramChange}
          required
          disabled={isEditing}
        >
          <option value="">Select Program</option>
          {Object.values(programs).map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>

        <div>
          Specialization: {programs[program_id]?.specialization || "N/A"}
        </div>

        <div className={style.programDetail}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            PROGRAM COURSELIST
         
              <span className={style.buttonLoc}>
                {!isEditing ? (
                  <>
                    <FaPencilAlt
                      title={program_id === "" ? "Select a program to enable editing" : "Enable Editing"}
                      className={`${style.editIcon} ${program_id === "" ? style.disabled : ""}`}
                      onClick={startEditing}
                    />
                    <FaPrint
                      title="Print Program Course List"
                      className={style.printIcon}
                      onClick={handlePrint}
                    />
                  </>
                ) : (
                  <>
                    <button onClick={saveEditing} className={style.buttons}>
                      Save
                    </button>
                    <button onClick={cancelEditing} className={style.buttons}>
                      Cancel
                    </button>
                  </>
                )}
              </span>
            
          </h3>

          <ProgramTable
            courses={courses}
            isEditing={isEditing}
            isAdding={isAdding}
            onSetIsAdding={setIsAdding}
            editingRowId={editingRowId}
            onSetEditingRowId={setEditingRowId}
            onReorder={(newOrder) => setCourses(newOrder)}
            onCourseChange={(id, field, value) => {
              setCourses((prev) =>
                prev.map((c) => {
                  if (c.course_id !== id) return c;
                  const isLab = c.course_id.trim().toLowerCase().endsWith("l");
                  if ((field === "hours_lec" || field === "units_lec") && !isLab) {
                    return { ...c, [field]: value };
                  }
                  if ((field === "hours_lab" || field === "units_lab") && isLab) {
                    return { ...c, [field]: value };
                  }
                  return { ...c, [field]: value };
                })
              );
            }}
            onCourseDelete={(id) => setCourses((prev) => prev.filter((c) => c.course_id !== id))}
            onAddCourse={(year, sem) => {
              setIsAdding(true);
              const newId = `new-${Date.now()}`;
              const newCourse = {
                course_id: newId,
                course_name: "Course",
                course_year: year,
                course_sem: sem,
                course_hours: 0,
                course_units: 0,
                course_preq: "None",
                hours_lec: 0,
                hours_lab: 0,
                units_lec: 0,
                units_lab: 0,
                sequence: courses.length + 1,
              };
              const insertIndex = courses.reduce((idx, c, i) => {
                if (c.course_year === year && c.course_sem === sem) return i;
                return idx;
              }, -1);
              const updated = [
                ...courses.slice(0, insertIndex + 1),
                newCourse,
                ...courses.slice(insertIndex + 1),
              ];
              setCourses(updated);
              return newId;
            }}
          />
        </div>
      </div>
    </div>
  );
}