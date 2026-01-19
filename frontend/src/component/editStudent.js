import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./modal";
import style from "../style/button.module.css"
import { FaPen, FaPlus } from "react-icons/fa";
import { createPortal } from "react-dom";

export default function EditStudent({ onSubmit, student, isViewing }) {
    let title = "Edit Student"
    const [programs, setPrograms] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        id: "",
        email: "",
        dept: "",
        program_id: "",
        f_name: "",
        l_name: "",
        m_name: "",
        year: "",
        status: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        setShowModal(false);
    };


    useEffect(() => {
    if(showModal){
        document.body.style.overflow = "hidden";
    }
    else{
        document.body.style.overflow = "";
    }

    return () => {
        document.body.style.overflow = "";
    };

    }, [showModal])

    useEffect(() => {
        if (student) {
            setFormData({
                id: student.id || "",
                email: student.email || "",
                dept: student.dept || "",
                program_id: student.program_id || "",
                f_name: student.f_name || "",
                l_name: student.l_name || "",
                m_name: student.m_name || "",
                year: student.year || "",
                status: student.status || "",
            });
        }
    }, [student]);

    useEffect(() => {
        const progrs = JSON.parse(sessionStorage.getItem("programs"));

        setPrograms(progrs);
    }, []);

    return (
    <>
        <FaPen
        title={isViewing ? "Edit Student" : "No student selected"}
        onClick={() => {
            if (!isViewing) return;
            setShowModal(true);
        }}
        className={`${style.editIcon} ${!isViewing ? style.disabled : ""}`}
        />


        {showModal && createPortal(
                    <Modal title={title} programs={programs} formData={formData} 
                            handleSubmit={handleSubmit} handleChange={handleChange} 
                            onClose={() => setShowModal(false)}
                            isEdit={true} />
                            , document.body
        )}
    </>
    );
}