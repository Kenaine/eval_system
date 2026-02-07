import React, { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/dashboard.module.css";

import HeaderWebsite from "../component/header";
import SimpleBarChart from "../component/dashboard/graphs/barChart";
import PieChartWithPaddingAngle from "../component/dashboard/graphs/pieChart";

import { API_URL } from "../misc/url";

export default function Dashbaord() {
    const pageName = "DASHBOARD";

    const [student_list, setStudentList] = useState([]);
    const [total_student, setTotalStudent] = useState(0);
    const [year_cnt, setYearCnt] = useState([]);
    const [regStat_cnt, setRegStatCnt] = useState([]);
    const [transfereeStat_cnt, setTransfereeStatCnt] = useState([]);
    const [programs, setPrograms] = useState([]);    

    const changeData = async (key, value) => {
        axios.get( API_URL + `/student/filter/${key}/${value}`)
        .then((res) => {
            setStudentList(res.data);
        });
    };

    const changeCheckbox = (checkbox) => {
        changeData(checkbox.target.name, checkbox.target.value);
    }

    useEffect(() =>{
        axios.put(API_URL + '/student/reset_filter')
        
        axios.get( API_URL + '/student/get_all')
        .then((res) => {
            setStudentList(res.data);
        });
        
        const programs = JSON.parse(sessionStorage.getItem("programs"));
        setPrograms(programs);
    }, []);

    
    useEffect(() => {
        var cntYear = [0, 0, 0, 0];
        var cntRegStat = [{ status: "Regular", num: 0 }, { status: "Irregular", num: 0 }];
        var cntTransStat = [{ status: true, num: 0 }, { status: false, num: 0 }];
        var total = 0;

        student_list.forEach(student => {
            cntYear[student["year"] - 1]++;
            if(student["status"] === "Regular")
                ++cntRegStat[0]["num"];
            else
                ++cntRegStat[1]["num"];

            if(student["is_transferee"] === true)
                ++cntTransStat[0]["num"];
            else
                ++cntTransStat[1]["num"];  

        ++total;
        });

        setTotalStudent(total);
        setYearCnt(cntYear);
        setRegStatCnt(cntRegStat);
        setTransfereeStatCnt(cntTransStat);
    }, [student_list]);



    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />
            <div className={style.dashboard}>
                <div style={{display:"flex", gap:"20px"}}>
                    <div style={{width:"70%", gap: "20px", display: "flex", flexDirection: "column"}}>
                        <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                            <NumberStudents cntYear={year_cnt} total_student={total_student} />
                            
                        </div>

                        <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                            <SimpleBarChart data={regStat_cnt} changeData={changeData}/>
                            <PieChartWithPaddingAngle data={transfereeStat_cnt} changeData={changeData}/>
                        </div>
                    </div>

                    <div className={style.programs}>
                        <div className={style.title}>
                            Programs
                        </div>

                        <ul className={style.programList}>
                            {Object.values(programs).map(program => (
                                <li>
                                    <input defaultChecked={true} type="checkbox" id={program.name} name="program_id"
                                    value={program.id} onClick={changeCheckbox}/>
                                    <label htmlFor={program.name}>
                                        {program.name}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                    <TableStudents student_list={student_list}/>
                </div>
            </div>
        </div>
    );
}

const NumberStudents = ({cntYear, total_student}) => {
    return (
        <>
            {cntYear.map((num, index) => (
                <div className={style.block} key={index}>
                    <div className={style.title}>
                        {"Year " + (index + 1)}
                    </div>

                    <div>{num}</div>
                </div>
            ))}
            <div className={style.block}>
                <div className={style.title}>Total Students</div>

                <div>{total_student}</div>
            </div>
        </>
    );
} 

const TableStudents = ({student_list}) => {
    return (
        <table className={style.scrollable}>
            <thead>
                <tr>
                    <th></th>
                    <div className={style.tableData}>
                        <th>Student ID</th>
                        <th>Year</th>
                        <th>GWA</th>
                    </div>
                </tr>
            </thead>
            <tbody>
                {student_list.map((student, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <div className={style.tableData}>
                            <td>{student.id}</td>
                            <td>{student.year}</td>
                            <td>{student.gwa}</td>
                        </div>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

