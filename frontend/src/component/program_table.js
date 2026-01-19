import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaPencilAlt, FaGripVertical, FaTrash, FaPlus } from "react-icons/fa";
import style from "../style/draggable.module.css";

function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function normalizeCourse(course) {
  const isLab = course.course_id.trim().endsWith("L");
  return {
    ...course,
    isLab,
    hours_lec: isLab ? 0 : course.course_hours,
    hours_lab: isLab ? course.course_hours : 0,
    units_lec: isLab ? 0 : course.course_units,
    units_lab: isLab ? course.course_units : 0,
  };
}

function SortableRow({
  course,
  isTableEditing,
  isRowEditing,
  isAddingCourse,
  onRowEditClick,
  onRowSaveClick,
  onRowCancelClick,
  onRowDeleteClick,
  onFieldChange,
  disableDrag,
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({ id: course.course_id });

  const normalized = normalizeCourse(course);

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={rowStyle} className={style.defaultRow}>
      <td>

        {isAddingCourse && isRowEditing ? (
          <input
            type="text"
            value={normalized.course_id}
            onChange={(e) => onFieldChange("course_id", e.target.value)}
          />
        ) : (
          normalized.course_id
          )}
      </td>

      <td>
        {isRowEditing ? (
          <input
            type="text"
            value={normalized.course_name || "Course"}
            onChange={(e) => onFieldChange("course_name", e.target.value)}
            required
          />
        ) : (
          normalized.course_name
        )}
      </td>

      <td>
        {isRowEditing ? (
          <input
            type="number"
            value={normalized.hours_lec}
            onChange={(e) => onFieldChange("hours_lec", +e.target.value)}
          />
        ) : (
          normalized.hours_lec
        )}
      </td>

      <td>
        {isRowEditing ? (
          <input
            type="number"
            value={normalized.hours_lab}
            onChange={(e) => onFieldChange("hours_lab", +e.target.value)}
          />
        ) : (
          normalized.hours_lab
        )}
      </td>

      <td>
        {isRowEditing ? (
          <input
            type="number"
            value={normalized.units_lec}
            onChange={(e) => onFieldChange("units_lec", +e.target.value)}
          />
        ) : (
          normalized.units_lec
        )}
      </td>

      <td>
        {isRowEditing ? (
          <input
            type="number"
            value={normalized.units_lab}
            onChange={(e) => onFieldChange("units_lab", +e.target.value)}
          />
        ) : (
          normalized.units_lab
        )}
      </td>

      <td>
        {isRowEditing ? (
          <input
            type="text"
            value={normalized.course_preq || ""}
            onChange={(e) => onFieldChange("course_preq", e.target.value)}
          />
        ) : (
          normalized.course_preq
        )}
      </td>

      {isTableEditing && (
        <td className={style.actionCell}>
          {isRowEditing ? (
            <span style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <button onClick={onRowSaveClick}>Save</button>
              <button onClick={onRowCancelClick}>Cancel</button>
            </span>
          ) : (
            <span style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <FaPencilAlt
                style={{ cursor: "pointer" }}
                title="Edit Row"
                onClick={onRowEditClick}
              />
              {!disableDrag && (
                <FaGripVertical
                  ref={setActivatorNodeRef}
                  {...attributes}
                  {...listeners}
                  className={style.dragHandle}
                  title="Drag"
                />
              )}
              <FaTrash
                style={{ cursor: "pointer", color: "red" }}
                title="Delete Row"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this course?")) {
                    onRowDeleteClick();
                  }
                }}
              />
            </span>
          )}
        </td>
      )}
    </tr>
  );
}

export default function ProgramTable({
  courses,
  isAdding,
  onSetIsAdding,
  isEditing,
  editingRowId,
  onSetEditingRowId,
  onReorder,
  onCourseChange,
  onCourseDelete,
  onAddCourse,
}) {
  const rows = [];
  let prevYear = null,
    prevSem = null;

  const handleDragEnd = (event) => {
    if (!isEditing) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = courses.findIndex((c) => c.course_id === active.id);
    const newIndex = courses.findIndex((c) => c.course_id === over.id);

    const reordered = arrayMove(courses, oldIndex, newIndex).map((course, index) => ({
      ...course,
      sequence: index + 1, // update sequence globally in new order
    }));

    onReorder(reordered);
  };

  const handleCancel = () => {
    onSetEditingRowId(null)
    onSetIsAdding(false)
  }

  const handleAddCourseClick = (year, sem) => {
    
    const newId = onAddCourse(year, sem);
    if (newId) onSetEditingRowId(newId);
  };

  courses.forEach((course) => {
    if (course.course_year !== prevYear || course.course_sem !== prevSem) {
      rows.push(
        <tr
          key={`header-${course.course_year}-${course.course_sem}`}
          className={style.yearSem}
        >
          <td colSpan="8" style={{ fontWeight: "bold" }}>
            {ordinal(course.course_year)} Year, {ordinal(course.course_sem)} Sem
            {isEditing && (
              <FaPlus
                style={{ cursor: "pointer", color: "green", marginLeft: "1rem" }}
                title="Add course"
                onClick={() => handleAddCourseClick(course.course_year, course.course_sem)}
              />
            )}
          </td>
        </tr>
      );
      prevYear = course.course_year;
      prevSem = course.course_sem;
    }

    rows.push(
      <SortableRow
        key={course.course_id}
        course={course}
        isAddingCourse={isAdding}
        isTableEditing={isEditing}
        isRowEditing={editingRowId === course.course_id}
        onRowEditClick={() => onSetEditingRowId(course.course_id)}
        onRowSaveClick={() => onSetEditingRowId(null)}
        onRowCancelClick={() => handleCancel()}
        onRowDeleteClick={() => onCourseDelete(course.course_id)}
        onFieldChange={(field, value) => onCourseChange(course.course_id, field, value)}
        disableDrag={!isEditing}
      />
    );
  });

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={courses.map((c) => c.course_id)}
        strategy={verticalListSortingStrategy}
      >
        <table className={style.table}>
          <thead>
            <tr>
              <th rowSpan="2">SUB CODE</th>
              <th rowSpan="2">SUB DESCRIPTION</th>
              <th colSpan="2">HOURS</th>
              <th colSpan="2">TOTAL UNIT</th>
              <th rowSpan="2">PREREQUISITE</th>
              {isEditing && <th rowSpan="2">Actions</th>}
            </tr>
            <tr>
              <th>LEC</th>
              <th>LAB</th>
              <th>LEC</th>
              <th>LAB</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </SortableContext>
    </DndContext>
  );
}