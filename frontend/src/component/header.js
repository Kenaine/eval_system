import react, { useState } from "react";
import { FaArrowCircleDown, FaArrowCircleUp, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from "../imgs/uphsllogo.png";
import style from "../style/header.module.css"

export default function HeaderWebsite({ pageName }){
    const navigate = useNavigate();
    const [isDown, setIsDown] = useState(false);
    const pageList = [
        { link: "Dashboard", path: "/dashboard" }, 
        { link: "Program Courselist", path: "/program-courselist" }, 
        { link: "Curriculum Checklist", path: "/curriculum-checklist" },
        { link: "New Checklist", path: "/new" }
    ];

    const signOut = () => {
        sessionStorage.removeItem('supabase_token');
        sessionStorage.removeItem('user_profile');
        sessionStorage.removeItem('programs');
        navigate("/");
    };

    const setBannerDown = () =>{
        setIsDown(!isDown);
    }

    const handleBannerClick = (page) => {
        navigate(page.path);
    };

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