import React, { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/dashboard.module.css";

import HeaderWebsite from "../component/header";
import SimpleBarChart from "../component/graphs/barChart";
import PieChartWithPaddingAngle from "../component/graphs/pieChart";

const students = [
    {
        student_id: "2021001",
        year: "1st Year",
        gwa: 1.75
    },
    {
        student_id: "2021002",
        year: "2nd Year",
        gwa: 2.00
    },
    {
        student_id: "2021003",
        year: "3rd Year",
        gwa: 1.50
    },
    {
        student_id: "2021004",
        year: "4th Year",
        gwa: 1.25
    }
]

export default function Dashbaord() {
    const pageName = "DASHBOARD";

    const [student_list, setStudentList] = useState([]);
    const [year_cnt, setYearCnt] = useState([]);
    const [regStat_cnt, setRegStatCnt] = useState([]);
    const [transfereeStat_cnt, setTransfereeStatCnt] = useState([]);

    useEffect(() =>{
        axios.get('http://127.0.0.1:8000/student/get_all')
        .then((res) => {
            setStudentList(res.data)
        });
    }, []);

    useEffect(() => {
        var cntYear = [0, 0, 0, 0];
        var cntRegStat = [{ status: "Regular", num: 0 }, { status: "Irregular", num: 0 }];
        var cntTransStat = [{ status: true, num: 0 }, { status: false, num: 0 }];

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

        setYearCnt(cntYear);
        setRegStatCnt(cntRegStat);
        setTransfereeStatCnt(cntTransStat);
        console.log(cntRegStat);
    });
    }, [student_list]);



    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />
            <div className={style.dashboard}>
                <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                    <NumberStudents cntYear={year_cnt} />
                    <div className={style.block}>
                        <div className={style.title}>
                            Programs
                        </div>

                        <div>4</div>
                    </div>

                </div>

                <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                    <SimpleBarChart data={regStat_cnt}/>
                    <PieChartWithPaddingAngle />
                </div>

                <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                    <TableStudents student_list={student_list}/>
                </div>
            </div>
        </div>
    );
}

const NumberStudents = ({cntYear}) => {
    return (
        cntYear.map((num, index) => (
            <div className={style.block} key={index}>
                <div className={style.title}>
                    {"Year " + (index + 1)}
                </div>

                <div>{num}</div>
            </div>
        ))
    );
} 

const TableStudents = ({student_list}) => {
    return (
        <table className={style.scrollable}>
            <thead>
                <tr>
                    <th></th>
                    <th>Student ID</th>
                    <th>Year</th>
                    <th>GWA</th>
                </tr>
            </thead>
            <tbody>
                {student_list.map((student, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{student.id}</td>
                        <td>{student.year}</td>
                        <td>{student.gwa}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

