import react, { useState, useEffect, use } from "react";
import { FaArrowCircleDown, FaArrowCircleUp, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from "../imgs/uphsllogo.png";
import style from "../style/header.module.css"
import axios from "axios";

export default function HeaderWebsite({ pageName }){
    const navigate = useNavigate();
    const [isDown, setIsDown] = useState(false);
    const pageList = [
        { link: "Dashboard", path: "/dashboard" }, 
        { link: "Program Courselist", path: "/program-courselist" }, 
        { link: "Curriculum Checklist", path: "/curriculum-checklist" }
    ];

    const signOut = async () => {
        try {
            await axios.post("http://127.0.0.1:8000/auth/logout", {}, { withCredentials: true });
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            navigate("/");
        }
    };

    const setBannerDown = () =>{
        setIsDown(!isDown);
    }

    const handleBannerClick = (page) => {
        navigate(page.path);
    };

    const validateToken = async () => {
        try {
            const response = await fetch("http://localhost:8000/auth/validate-token", {
                method: "GET",
                withCredentials: true,
            });

            if (!response.valid) {
                signOut();
            }

        } catch (error) {
            console.error("Error validating token:", error);
            signOut();
        }
    }

    // Filter out the current page from the list
    const filteredPages = pageList.filter(page => page.link.toLowerCase() !== pageName.toLowerCase());

    return(
        <header>
            <div className={style.logo}>
                <b>--UNIVERSITY</b>
            </div>
            <div className={isDown ? `${style.center} ${style.animated}` : style.center}>
                <div className={style.banner}>
                    {filteredPages.map((page) => (
                        <span key={page.link} onClick={() => handleBannerClick(page)}>
                            {page.link}
                        </span>
                    ))}
                    <a onClick={setBannerDown}>{pageName}</a>
                    <div className={style.drop_icon} onClick={setBannerDown}>
                        <FaChevronDown />
                    </div>
                </div>
            </div>
            <button className={style.signOut} type="button" onClick={signOut}>
                SIGN OUT
            </button>
        </header>
    );
}