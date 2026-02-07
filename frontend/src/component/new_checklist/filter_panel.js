import React, { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";



export default function FilterPanel() {
    const pageName = "CURRICULUM CHECKLIST";
    const yearLevel = [1, 2, 3, 4];
    const regStatus = ["Regular", "Irregular"];
    const transferStatus = ["True", "False"];
    const [programs, setPrograms] = useState({});

    useEffect(() =>{
        const prgms = JSON.parse(sessionStorage.getItem("programs"))

        setPrograms(prgms);
    }, []);


    return (
        <>
            <fieldset>
                <legend>Year Number</legend>
                {yearLevel.map(year => (
                    <>
                        
                        <label htmlFor={year}>
                            <input type="checkbox" defaultChecked={true} id={year} 
                            name={year} value={year}></input> Year {year}
                        </label>
                    </>
                ))}

            </fieldset>
            <fieldset>
                <legend>Regular Status</legend>
                <input defaultChecked={true} type="checkbox" name="reg_status" value="regular"></input>
                <label htmlFor="reg_status">Regular</label>

                
                <label htmlFor="irreg_status" value="irregular">
                    <input type="checkbox" defaultChecked={true} name="irreg_status" value="irregular"></input>
                    Irregular</label>
            </fieldset>

            <fieldset>
                <legend>Transfer Status</legend>
                <label htmlFor="transferee">
                    <input type="checkbox" defaultChecked={true} name="transferee" value="true"></input> True
                </label>
                
                <label htmlFor="not_transferee">
                    <input type="checkbox" defaultChecked={true} name="not_transferee" value="false"></input>
                    False
                </label>
            </fieldset>

            <fieldset>
                <legend>Programs</legend>

                {Object.values(programs).map(program => (
                    <>
                        <label htmlFor={program.id}>
                            <input type="checkbox" defaultChecked={true} 
                            id={program.id} name={program.id} value={program.id}></input>
                            {program.id}
                        </label>
                    </>
                ))}
            </fieldset>
        </>
    );
}