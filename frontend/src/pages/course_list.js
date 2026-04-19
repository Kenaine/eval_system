import React, { useEffect, useState } from "react";
import style from "../style/programlist.module.css";
import HeaderWebsite from "../component/header";
import apiClient from "../lib/api";

import CoursesTable from "../component/course_list/courses_table";

export default function CourseList() {
  const pageName = "Course List";
  const COURSE_LIST_CACHE_KEY = "course_list_cache";

  const [courses, setCourses] = useState([])

  useEffect(() => {
    getCourses();
  }, [])

  const getCourses = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedCourses = sessionStorage.getItem(COURSE_LIST_CACHE_KEY);
      if (cachedCourses) {
        try {
          setCourses(JSON.parse(cachedCourses));
          return;
        } catch {
          sessionStorage.removeItem(COURSE_LIST_CACHE_KEY);
        }
      }
    }

    await apiClient.get(`/course/getAll`)
      .then((res) => {
        const latestCourses = res.data || [];
        setCourses(latestCourses);
        sessionStorage.setItem(COURSE_LIST_CACHE_KEY, JSON.stringify(latestCourses));
      })
      .catch((err) =>{
        console.log(err);
      });
  };

  const recacheCourses = () => getCourses(true);

  return (
    <div className={style.programChecklist}>
      <HeaderWebsite pageName={pageName} />
      <div className={style.courseBody}>

        <div className={style.programDetail}>
            <CoursesTable courses={courses} onCourseAdded={recacheCourses} />

        </div>
      </div>
    </div>
  );
}
