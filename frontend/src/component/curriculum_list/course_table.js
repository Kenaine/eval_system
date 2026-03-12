import React from "react";
import { FaGripVertical } from "react-icons/fa";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export default function CourseTable({ courses, onReorder, curriculum, onDelete }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = courses.findIndex((c) => c.course_id === active.id);
    const newIndex = courses.findIndex((c) => c.course_id === over.id);

    const reordered = arrayMove(courses, oldIndex, newIndex);
    onReorder(reordered);
  };

  const coursesByYearSem = {};
  courses.forEach((course) => {
    const key = `${course.course_year || 1}-${course.course_sem || 1}`;
    if (!coursesByYearSem[key]) {
      coursesByYearSem[key] = [];
    }
    coursesByYearSem[key].push(course);
  });

  // Get all year-sem combinations that have courses, sorted properly
  const sortedYearSems = Object.keys(coursesByYearSem).sort((a, b) => {
    const [yearA, semA] = a.split('-').map(Number);
    const [yearB, semB] = b.split('-').map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return semA - semB;
  });

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={courses.map((c) => c.course_id)}
        strategy={verticalListSortingStrategy}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", textAlign: "center"}}>
          <thead>
            <tr>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>Drag</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>SUB CODE</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>SUB DESCRIPTION</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>LEC HOURS</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>LAB HOURS</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>LEC UNITS</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>LAB UNITS</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>PREREQUISITE</th>
              <th style={{ padding: "0.75rem", textAlign: "center" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sortedYearSems.map((key) => {
              const [year, sem] = key.split('-').map(Number);
              const yearSemCourses = coursesByYearSem[key];

              return (
                <React.Fragment key={key}>
                  <tr style={{ backgroundColor: "#d6eaff", fontWeight: "bold" }}>
                    <td colSpan="9" style={{ padding: "0.75rem" }}>
                      {ordinal(year)} Year, {ordinal(sem)} Sem
                    </td>
                  </tr>
                  {yearSemCourses.map((course) => (
                    <SortableCourseRow 
                      key={course.course_id} 
                      course={course} 
                      curriculum={curriculum}
                      onDelete={onDelete}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </SortableContext>
    </DndContext>
  );
}

function SortableCourseRow({ course, curriculum, onDelete }) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({ id: course.course_id });

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${course.course_name}?`)) {
      onDelete(course.course_id, curriculum);
    }
  };

  return (
    <tr ref={setNodeRef} style={rowStyle}>
      <td style={{ textAlign: "center" }}>
        <FaGripVertical
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          style={{ cursor: "grab" }}
          title="Drag to reorder"
        />
      </td>
      <td>{course.course_id}</td>
      <td>{course.course_name}</td>
      <td>{course.hours_lec || 0}</td>
      <td>{course.hours_lab || 0}</td>
      <td>{course.units_lec || 0}</td>
      <td>{course.units_lab || 0}</td>
      <td>{course.course_preq || "None"}</td>
      <td style={{ textAlign: "center" }}>
        <button
          onClick={handleDelete}
          style={{
            padding: "0.4rem 0.8rem",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
