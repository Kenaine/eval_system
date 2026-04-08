import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./modal";
import { FaPlus } from "react-icons/fa";
import { createPortal } from "react-dom";
import apiClient from "../lib/api";

export default function AddStudent({ onSubmit }) {
  let title = "Add New Student";
  const [programs, setPrograms] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    email: "",
    dept: "",
    program_id: "",
    curriculum: "",
    f_name: "",
    l_name: "",
    m_name: "",
    gender: "",
    year: "",
    status: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "program_id") {
      setFormData({ ...formData, program_id: value, curriculum: "" });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert year to integer before submitting
    const dataToSubmit = {
      ...formData,
      year: parseInt(formData.year, 10) || 0,
    };
    onSubmit(dataToSubmit);
    setShowModal(false);
    setFormData({
      student_id: "",
      email: "",
      dept: "",
      program_id: "",
      curriculum: "",
      f_name: "",
      l_name: "",
      m_name: "",
      gender: "",
      year: "",
      status: "",
    });
  };

  useEffect(() => {
    const progrs = JSON.parse(sessionStorage.getItem("programs"));

    setPrograms(progrs || {});

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
    if (!showModal || !formData.program_id) {
      setCurriculums([]);
      return;
    }

    apiClient
      .get(`/curriculum/get/${formData.program_id}`)
      .then((res) => {
        setCurriculums(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Failed to load curriculums:", err);
        setCurriculums([]);
      });
  }, [formData.program_id, showModal]);

  return (
    <>
      <FaPlus
        style={{ cursor: "pointer" }}
        title="Add Student"
        onClick={() => setShowModal(true)}
      />
      {showModal && createPortal(
                    <Modal title={title} programs={programs} formData={formData} 
                          handleSubmit={handleSubmit} handleChange={handleChange} 
                          onClose={() => setShowModal(false)}
                          isEdit={false}
                          curriculums={curriculums}
                          showCurriculumSelect={true} />
                          , document.body
      )}
    </>
  );
}