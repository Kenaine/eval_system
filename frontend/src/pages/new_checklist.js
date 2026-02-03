import React, { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/new_checklist/new_checklist.module.css";

import HeaderWebsite from "../component/header";
import NewStudentSearchBar from "../component/new_checklist/new_searchBar";
import FilterPanel from "../component/new_checklist/filter_panel";
import SearchResult from "../component/new_checklist/search_result";



export default function NewChecklist() {
    const pageName = "CURRICULUM CHECKLIST";
    const [students, setStudents] = useState([]);

    return (
        <div>
            <HeaderWebsite pageName={pageName} />
            
            <div className={style.searchContainer}>
                <div className={style.section}>
                    <h2>Search Student</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <NewStudentSearchBar setStudents={setStudents}/>

                        <fieldset>
                            <legend>filters</legend>

                            <FilterPanel />
                        </fieldset>
                    </form>

                    <SearchResult student_list={students} />

                </div>

                <div className={style.section}>
                    asd
                </div>
            </div>
        </div>
    );
}