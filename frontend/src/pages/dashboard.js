import React, { useEffect, useState } from "react";
import { FaPrint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/checklist.module.css";

import HeaderWebsite from "../component/header";

import { useUser, useCourses, useFetchStudentInfo } from "../App";

export default function Dashbaord() {
    const pageName = "DASHBOARD";

    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />

            <div className={style.dashboard}>
<iframe width="800" height="600" src="https://lookerstudio.google.com/embed/reporting/b7cd4313-e8be-43e2-be2d-4ba01e3bc251/page/yIshF" frameborder="0" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>            </div>
        </div>
    );
}