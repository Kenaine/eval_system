import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../../misc/url";
import style from "../../style/new_checklist/new_checklist.module.css";

export default function FilterPanel({ onFilterChange }) {
    const yearLevel = [1, 2, 3, 4];
    const [programs, setPrograms] = useState([]);
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const prgms = JSON.parse(sessionStorage.getItem("programs"));
        if (prgms) {
            setPrograms(prgms);
        } else {
            // Fetch programs if not in sessionStorage
            const token = sessionStorage.getItem('supabase_token');
            axios.get(API_URL + '/program/get', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
                .then(res => {
                    // Store as array - programs have program_id, program_name, program_specialization
                    sessionStorage.setItem("programs", JSON.stringify(res.data));
                    setPrograms(res.data);
                })
                .catch(err => console.error("Failed to load programs:", err));
        }
    }, []);

    const handleFilterChange = async (e) => {
        const { name, value } = e.target;
        
        setIsUpdating(true);
        try {
            // Wait for backend filter to be updated
            await axios.post(API_URL + `/student/edit_filter/${name}/${value}`, {}, {
                withCredentials: true
            });
            
            // Only call callback after backend confirms the update
            onFilterChange(name, value);
        } catch (err) {
            console.error("Filter update failed:", err);
            alert("Failed to update filter. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className={style.filterPanel}>
            <button 
                className={style.filterToggle}
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                type="button"
                disabled={isUpdating}
                title={isUpdating ? "Updating filters..." : ""}
                style={isUpdating ? { opacity: 0.6, cursor: "wait" } : {}}
            >
                <span>Advanced Filters {isUpdating && "..."}</span>
                {filtersExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            
            {filtersExpanded && (
                <div className={style.filterGrid}>
                    <fieldset className={style.compactFieldset} disabled={isUpdating}>
                        <legend>Year</legend>
                        <div className={style.filterRow}>
                            {yearLevel.map(year => (
                                <label key={year} htmlFor={`year-${year}`} style={isUpdating ? { opacity: 0.6, pointerEvents: "none" } : {}}>
                                    <input type="checkbox" defaultChecked={true} id={`year-${year}`} 
                                    name="year" value={year} onChange={handleFilterChange} disabled={isUpdating} />
                                    {year}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className={style.compactFieldset} disabled={isUpdating}>
                        <legend>Status</legend>
                        <div className={style.filterRow}>
                            <label htmlFor="reg_status" style={isUpdating ? { opacity: 0.6, pointerEvents: "none" } : {}}>
                                <input type="checkbox" defaultChecked={true} 
                                id="reg_status" name="status" value="Regular" onChange={handleFilterChange} disabled={isUpdating} />
                                Regular
                            </label>
                            <label htmlFor="irregular" style={isUpdating ? { opacity: 0.6, pointerEvents: "none" } : {}}>
                                <input type="checkbox" defaultChecked={true} 
                                id="irregular" name="status" value="Irregular" onChange={handleFilterChange} disabled={isUpdating} />
                                Irregular
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className={style.compactFieldset} disabled={isUpdating}>
                        <legend>Transfer</legend>
                        <div className={style.filterRow}>
                            <label htmlFor="transferee" style={isUpdating ? { opacity: 0.6, pointerEvents: "none" } : {}}>
                                <input type="checkbox" defaultChecked={true} 
                                id="transferee" name="is_transferee" value="true" onChange={handleFilterChange} disabled={isUpdating} /> 
                                Yes
                            </label>
                            <label htmlFor="not_transferee" style={isUpdating ? { opacity: 0.6, pointerEvents: "none" } : {}}>
                                <input type="checkbox" defaultChecked={true} 
                                id="not_transferee" name="is_transferee" value="false" onChange={handleFilterChange} disabled={isUpdating} />
                                No
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className={style.compactFieldset} disabled={isUpdating}>
                        <legend>Archived</legend>
                        <div className={style.filterRow}>
                            <label htmlFor="archived" style={isUpdating ? { opacity: 0.6, pointerEvents: "none" } : {}}>
                                <input type="checkbox" defaultChecked={true} 
                                id="archived" name="archived" value="true" onChange={handleFilterChange} disabled={isUpdating} />
                                Yes
                            </label>
                            <label htmlFor="not_archived" style={isUpdating ? { opacity: 0.6, pointerEvents: "none" } : {}}>
                                <input type="checkbox" defaultChecked={true}
                                id="not_archived" name="archived" value="false" onChange={handleFilterChange} disabled={isUpdating} />
                                No
                            </label>
                        </div>
                    </fieldset>

                    {programs.length > 0 && (
                        <fieldset className={`${style.compactFieldset} ${style.fullWidth}`} disabled={isUpdating}>
                            <legend>Programs</legend>
                            <div className={style.filterRow}>
                                {programs.map(program => (
                                    <label key={program.program_id} htmlFor={`prog-${program.program_id}`} style={isUpdating ? { opacity: 0.6, pointerEvents: "none" } : {}}>
                                        <input type="checkbox" defaultChecked={true} 
                                        id={`prog-${program.program_id}`} name="program_id" value={program.program_id} onChange={handleFilterChange} disabled={isUpdating} />
                                        {program.program_id}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    )}
                </div>
            )}
        </div>
    );
}