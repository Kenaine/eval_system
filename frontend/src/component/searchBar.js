import React, { useState, useEffect } from "react";
import axios from "axios";
import style from "../style/searchbar.module.css";

import { API_URL } from "../misc/url";

export default function StudentSearchBar({onSelectStudent}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (query.trim() === "") {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const delayDebounce = setTimeout(() => {
            axios.get(API_URL + `/student/search?q=${query}`, {
                withCredentials: true
            })
            .then((res) => {
                setResults(res.data);
                setShowDropdown(true);
            })
            .catch((err) => {
                console.error("Search failed:", err);
                setResults([]);
                setShowDropdown(false);
            });
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    const handleSelect = (student) => {
        onSelectStudent(student.student_id);
        setQuery(""); 
        setResults([]);
        setShowDropdown(false);
    };

    return (
        <div className={style.searchContainer}>
            <input
                className={style.searchBar}
                type="text"
                placeholder="SEARCH STUDENT..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results?.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {showDropdown && results?.length > 0 && (
                <ul className={style.dropdown}>
                    {results.map((student, index) => (
                        <li
                            key={index}
                            className={style.dropdownItem}
                            onMouseDown={() => handleSelect(student)}
                        >
                            {student.student_id} – {student.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
