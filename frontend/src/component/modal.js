import { react } from "react";
import style from "../style/studentPopUp.module.css";


export default function Modal({title, programs, formData, handleSubmit, handleChange, onClose, isEdit}){
    return(
        <div className={style.modalOverlay}>
            <div className={style.modalContent}>
                <h3>{title}</h3>
                <form onSubmit={handleSubmit} className={style.modalForm}>
                {isEdit === false && (
                    <input name="student_id" value={formData.student_id} onChange={handleChange} placeholder="Student ID" required />
                )}
                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
                <input name="dept" value={formData.dept} onChange={handleChange} placeholder="Department" required />
                <select name="program_id" value={formData.program_id} onChange={handleChange} required>
                    <option value="">Select Program</option>
                    {programs.map((program) => {
                    return (
                    <option key={program.program_id} value={program.program_id}>
                        {program.program_name}
                    </option>
                    );
                    })}
                </select>
                <input name="f_name" value={formData.f_name} onChange={handleChange} placeholder="First Name" required />
                <input name="l_name" value={formData.l_name} onChange={handleChange} placeholder="Last Name" required />
                <input name="m_name" value={formData.m_name} onChange={handleChange} placeholder="Middle Name" />
                <input name="year" value={formData.year} onChange={handleChange} placeholder="Year" type="number" required />
                <select name="status" value={formData.status} onChange={handleChange} required>
                    <option value="">Select Status</option>
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                </select>
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                    <button type="submit">Save</button>
                    <button type="button" onClick={onClose}>Cancel</button>
                </div>
                </form>
            </div>
        </div>
    );
}