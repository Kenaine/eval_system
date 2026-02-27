import React, { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../misc/url";



export default function FilterPanel({ onFilterChange }) {
    const pageName = "CURRICULUM CHECKLIST";
    const yearLevel = [1, 2, 3, 4];
    const regStatus = ["Regular", "Irregular"];
    const transferStatus = ["True", "False"];
    const [programs, setPrograms] = useState({});

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
                    const programsMap = {};
                    res.data.forEach(p => { programsMap[p.id] = p; });
                    sessionStorage.setItem("programs", JSON.stringify(programsMap));
                    setPrograms(programsMap);
                })
                .catch(err => console.error("Failed to load programs:", err));
        }
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        onFilterChange(name, value);

        axios.post(API_URL + `/student/edit_filter/${name}/${value}`, {}, {
            withCredentials: true
        })
        .catch((err) => {
            console.error("Filter update failed:", err);
        });
    };

    return (
        <>
            <fieldset>
                <legend>Year Number</legend>
                {yearLevel.map(year => (
                    <>
                        
                        <label htmlFor={year}>
                            <input type="checkbox" defaultChecked={true} id={year} 
                            name="year" value={year} onChange={handleFilterChange}></input> Year {year}
                        </label>
                    </>
                ))}

            </fieldset>
            <fieldset>
                <legend>Regular Status</legend>
                <input defaultChecked={true} type="checkbox" 
                id="reg_status" name="status" value="Regular" onChange={handleFilterChange}></input>
                <label htmlFor="reg_status">Regular</label>

                
                <label htmlFor="irreg_status">
                    <input type="checkbox" defaultChecked={true} 
                    id="irregular" name="status" value="Irregular" onChange={handleFilterChange}></input>
                    Irregular
                </label>
            </fieldset>

            <fieldset>
                <legend>Transfer Status</legend>
                <label htmlFor="transferee">
                    <input type="checkbox" defaultChecked={true} 
                    id="transferee" name="is_transferee" value="true" onChange={handleFilterChange}></input> 
                    True
                </label>
                
                <label htmlFor="not_transferee">
                    <input type="checkbox" defaultChecked={true} 
                    id="not_transferee" name="is_transferee" value="false" onChange={handleFilterChange}></input>
                    False
                </label>
            </fieldset>

            <fieldset>
                <legend>Archival Status</legend>
                <label htmlFor="archived">
                    <input type="checkbox" defaultChecked={true} 
                    id="archived" name="archived" value="true" onChange={handleFilterChange}></input>
                    True
                </label>

                <label htmlFor="not_archived">
                    <input type="checkbox" defaultChecked={true}
                    id="not_archived" name="archived" value="false" onChange={handleFilterChange}></input>
                    False
                </label>
            </fieldset>

            <fieldset>
                <legend>Programs</legend>

                {Object.values(programs || {}).map(program => (
                    <>
                        <label htmlFor={program.id}>
                            <input type="checkbox" defaultChecked={true} 
                            id={program.id} name="program_id" value={program.id} onChange={handleFilterChange}></input>
                            {program.id}
                        </label>
                    </>
                ))}
            </fieldset>
        </>
    );
}