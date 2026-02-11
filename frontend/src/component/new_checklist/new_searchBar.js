import React, { useState } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import style from "../../style/new_checklist/new_checklist.module.css";

import { API_URL } from "../../misc/url";

export default function NewStudentSearchBar({setStudents}) {
    const [inputValue, setInputValue] = useState("");

    const handleSearch = () => {
        if (inputValue.trim() === "") {
            setStudents([]);
            return;
        }

        axios.get(API_URL + `/student/search?q=${inputValue}`, {
            withCredentials: true
        })
        .then((res) => {
            setStudents(res.data);
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
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
                className={style.searchBar}
                type="text"
                placeholder="SEARCH STUDENT..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
            />
            <button 
                onClick={handleSearch}
                style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <FaSearch/>
            </button>
        </div>
    );
}
