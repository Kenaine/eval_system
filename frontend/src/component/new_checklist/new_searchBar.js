import React, { useState, useEffect } from "react";
import axios from "axios";
import style from "../../style/new_checklist/new_checklist.module.css";

import { API_URL } from "../../misc/url";

export default function NewStudentSearchBar({setStudents}) {
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (query.trim() === "") {
            setStudents([]);
            return;
        }

        axios.get(API_URL + `/student/search?q=${query}`, {
            withCredentials: true
        })
        .then((res) => {
            setStudents(res.data);
        })
        .catch((err) => {
            console.error("Search failed:", err);
            setStudents([]);
        });

    }, [query]);

    return (
        <div>
            <input
                className={style.searchBar}
                type="text"
                placeholder="SEARCH STUDENT..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
    );
}
