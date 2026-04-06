// Helper function to add ordinal suffix to numbers
function ordinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Generate print content for curriculum checklist
 * @param {Object} currentStudent - Student object with student_id, l_name, f_name, m_name, etc.
 * @param {Array} studentCourses - Array of course objects
 * @returns {string} HTML content for printing
 */
export const generateCurriculumChecklistPrint = (currentStudent, studentCourses) => {
    const studentName = `${currentStudent?.l_name}, ${currentStudent?.f_name} ${currentStudent?.m_name || ""}`.trim();

    // Sort courses by year and semester
    const sortedCourses = [...studentCourses].sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.semester - b.semester
    );

    // Build course table rows with year/semester headers
    let courseTableRows = "";
    
    if (sortedCourses.length === 0) {
        courseTableRows = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
                    No courses enrolled yet
                </td>
            </tr>
        `;
    } else {
        let prevYear = null;
        let prevSem = null;

        sortedCourses.forEach((course) => {
            if (course.year !== prevYear || course.semester !== prevSem) {
                courseTableRows += `
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td colspan="6">${ordinal(course.year)} Year, ${ordinal(course.semester)} Sem</td>
                    </tr>
                `;
                prevYear = course.year;
                prevSem = course.semester;
            }

            courseTableRows += `
                <tr>
                    <td>${course.course_id}</td>
                    <td>${course.course_name}</td>
                    <td>${course.course_units}</td>
                    <td>${course.grade === null ? "-" : course.course_units}</td>
                    <td>${course.grade ?? "-"}</td>
                    <td>${course.remark}</td>
                </tr>
            `;
        });
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student Curriculum Checklist - ${studentName}</title>
            <style>
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                }
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    font-size: 11px;
                    line-height: 1.2;
                }
                .student-info {
                    margin: 5px 0;
                    padding: 5px 0 5px 0;
                    border-bottom: 1px solid #333;
                }
                .student-info p {
                    margin: 2px 0;
                    font-size: 10px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 5px;
                    font-size: 10px;
                }
                th, td {
                    border: 1px solid #999;
                    padding: 4px 3px;
                    text-align: left;
                    overflow: hidden;
                }
                th {
                    background-color: #4CAF50;
                    color: white;
                    font-weight: bold;
                    font-size: 9px;
                    padding: 3px 2px;
                }
                td {
                    word-break: break-word;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                h1 {
                    text-align: center;
                    margin: 0;
                    padding: 5px 0 3px 0;
                    font-size: 16px;
                }
                @media print {
                    html, body {
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        margin: 3px;
                    }
                    thead {
                        display: table-header-group;
                    }
                }
            </style>
        </head>
        <body>
            <h1>Curriculum Checklist</h1>
            <div class="student-info">
                <p><strong>Student ID:</strong> ${currentStudent?.student_id}</p>
                <p><strong>Name:</strong> ${studentName}</p>
                <p><strong>Program:</strong> ${currentStudent?.program_id}</p>
                <p><strong>Year:</strong> ${currentStudent?.year}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>SUB CODE</th>
                        <th>SUB DESCRIPTION</th>
                        <th>TOTAL UNIT</th>
                        <th>CREDIT EARNED</th>
                        <th>GRADE</th>
                        <th>REMARK</th>
                    </tr>
                </thead>
                <tbody>
                    ${courseTableRows}
                </tbody>
            </table>
            <script>
                window.print();
                window.close();
            </script>
        </body>
        </html>
    `;
};
