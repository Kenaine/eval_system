import react, { useState } from "react";
import { FaHome, FaChartLine, FaList, FaClipboardCheck, FaBook, FaGraduationCap, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from "../imgs/uphsllogo.png";
import style from "../style/header.module.css"
import { useUser } from "../App";
import { isStudent } from "../lib/auth";

export default function HeaderWebsite({ pageName }){
    const navigate = useNavigate();
    const [currentUser] = useUser() || [];
    const pageList = [
        { link: "New Checklist", path: "/new", icon: FaHome, label: "Home" }, 
        { link: "Dashboard", path: "/dashboard", icon: FaChartLine, label: "Dashboard" }, 
        { link: "Program Courselist", path: "/program-courselist", icon: FaList, label: "Programs" }, 
        { link: "Curriculum Checklist", path: "/curriculum-checklist", icon: FaClipboardCheck, label: "Checklist" },
        { link: "Course List", path: "/course-list", icon: FaBook, label: "Courses" },
        { link: "Curriculum List", path: "/curriculum-list", icon: FaGraduationCap, label: "Curriculum" }
    ];
    const visiblePages = isStudent(currentUser?.role)
        ? pageList.filter((page) => page.path === "/curriculum-checklist")
        : pageList;

    const signOut = () => {
        sessionStorage.removeItem('supabase_token');
        sessionStorage.removeItem('user_profile');
        sessionStorage.removeItem('programs');
        navigate("/");
    };

    const handleNavClick = (page) => {
        navigate(page.path);
    };

    return(
        <header className={style.taskbar}>
            <div className={style.logo}>
                <b>--UNIVERSITY</b>
            </div>
            
            <nav className={style.navIcons}>
                {visiblePages.map((page) => {
                    const Icon = page.icon;
                    const isActive = page.link.toLowerCase() === pageName.toLowerCase();
                    return (
                        <div 
                            key={page.link} 
                            className={`${style.navItem} ${isActive ? style.active : ''}`}
                            onClick={() => handleNavClick(page)}
                            title={page.label}
                        >
                            <Icon className={style.icon} />
                            <span className={style.iconLabel}>{page.label}</span>
                        </div>
                    );
                })}
            </nav>

            <button className={style.signOut} type="button" onClick={signOut} title="Sign Out">
                <FaSignOutAlt />
            </button>
        </header>
    );
}