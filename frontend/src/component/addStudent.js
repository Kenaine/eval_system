import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./modal";
import { FaPlus } from "react-icons/fa";
import { createPortal } from "react-dom";

export default function AddStudent({ onSubmit }) {
  let title = "Add New Student";
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
    setFormData({
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
  };

  useEffect(() => {
    const progrs = JSON.parse(sessionStorage.getItem("programs"));

    setPrograms(progrs);

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
                          isEdit={false} />
                          , document.body
      )}
    </>
  );
}