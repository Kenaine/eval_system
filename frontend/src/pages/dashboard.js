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

    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />
            <div className={style.dashboard}>
                <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                    <NumberStudents title="1st Year Students" number="15" />
                    <NumberStudents title="2st Year Students" number="16" />
                    <NumberStudents title="3st Year Students" number="21" />
                    <NumberStudents title="4st Year Students" number="34" />
                    <NumberStudents title="Programs" number="4" />
                </div>

                <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                    <SimpleBarChart />
                    <PieChartWithPaddingAngle />
                </div>

                <div style={{"display":"flex", "gap":"20px", "justifyContent":"space-around"}}>
                    <TableStudents />
                </div>
            </div>
        </div>
    );
}

const NumberStudents = ({title, number}) => {
    return (
        <div className={style.block}>
            <div className={style.title}>
                {title}
            </div>

            <div>{number}</div>
        </div>
    );
} 

const TableStudents = () => {
    return (
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Student ID</th>
                    <th>Year</th>
                    <th>GWA</th>
                </tr>
            </thead>
            <tbody>
                {students.map((student, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{student.student_id}</td>
                        <td>{student.year}</td>
                        <td>{student.gwa}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

