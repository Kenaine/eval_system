import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import style from "../../style/new_checklist/new_checklist.module.css";
import apiClient from "../../lib/api";

export default function NewStudentSearchBar({setStudents}) {
    const [inputValue, setInputValue] = useState("");

    const handleSearch = () => {
        // Allow search with empty input to fetch all students
        const query = inputValue.trim();
        apiClient.get(`/student/search?q=${query}&apply_filters=true`)
        .then((res) => {
            setStudents(res.data);
            console.log("Search successful");
        })
        .catch((err) => {
            console.error("Search failed:", err);
            setStudents([]);
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div style={{ 
            display: "flex", 
            gap: "0.75rem", 
            alignItems: "center",
            marginBottom: "1rem"
        }}>
            <input
                className={style.searchBar}
                type="text"
                placeholder="Search by name or student ID..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
            />
            <button 
                onClick={handleSearch}
                style={{
                    padding: "0.875rem 1.25rem",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    minWidth: "50px"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
                }}
            >
                <FaSearch size={16}/>
            </button>
        </div>
    );
}
