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
    const [filters, setFilters] = useState({
        status: { value: "", active: false },
        is_transferee: { value: "", active: false },
        program_id: ["BSCS", "BSIT", "BSEMC", "BITCF"],
        year: [1, 2, 3, 4]
    });    

    const changeData = async (key, value) => {
        axios.get( API_URL + `/student/filter/${key}/${value}`)
        .then((res) => {
            setStudentList(res.data.filtered);
            // Update filters from server response
            if (res.data.filters) {
                setFilters(res.data.filters);
            }
        });
    };

    const changeCheckbox = (checkbox) => {
        changeData(checkbox.target.name, checkbox.target.value);
    }

    useEffect(() =>{
        axios.put(API_URL + '/student/reset_filter')
            .then((res) => {
                if (res.data && res.data.filters) {
                    setFilters(res.data.filters);
                }
            });
        
        axios.get( API_URL + '/student/get_all')
        .then((res) => {
            setStudentList(res.data);
        });
        
        const programs = JSON.parse(sessionStorage.getItem("programs"));
        setPrograms(programs || []);
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
                <div className={style.topSection}>
                    <div className={style.metricsSection}>
                        <div className={style.yearBlocks}>
                            <NumberStudents cntYear={year_cnt} total_student={total_student} />
                            
                        </div>

                        <div className={style.graphRow}>
                            <SimpleBarChart data={regStat_cnt} changeData={changeData}/>
                            <PieChartWithPaddingAngle data={transfereeStat_cnt} changeData={changeData}/>
                        </div>
                    </div>

                    <div className={style.programs}>
                        <div className={style.title}>
                            Filters
                        </div>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <div style={{ fontWeight: "500", marginBottom: "0.5rem" }}>Years</div>
                            <ul className={style.programList}>
                                {[1, 2, 3, 4].map(year => (
                                    <li key={year}>
                                        <input 
                                            checked={filters.year.includes(year)}
                                            type="checkbox" 
                                            id={`year-${year}`} 
                                            name="year"
                                            value={year} 
                                            onChange={changeCheckbox}
                                        />
                                        <label htmlFor={`year-${year}`}>
                                            Year {year}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <div style={{ fontWeight: "500", marginBottom: "0.5rem" }}>Programs</div>
                            <ul className={style.programList}>
                                {programs.map(program => (
                                    <li key={program.program_id}>
                                        <input 
                                            checked={filters.program_id.includes(program.program_id)}
                                            type="checkbox" 
                                            id={program.program_id} 
                                            name="program_id"
                                            value={program.program_id} 
                                            onChange={changeCheckbox}
                                        />
                                        <label htmlFor={program.program_id}>
                                            {program.program_id}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={style.tableWrap}>
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
        <div className={style.scrollable}>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Student ID</th>
                        <th>Year</th>
                        <th>GWA</th>
                    </tr>
                </thead>
                <tbody>
                    {student_list.map((student, index) => (
                        <tr key={student.student_id ?? index}>
                            <td>{index + 1}</td>
                            <td>{student.student_id}</td>
                            <td>{student.year}</td>
                            <td>{student.gwa}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

