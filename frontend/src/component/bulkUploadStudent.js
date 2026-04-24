import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaUpload } from "react-icons/fa";
import apiClient from "../lib/api";

/**
 * BulkUploadStudent
 * Lets the admin upload a CSV to bulk-insert students.
 *
 * Required CSV columns:
 *   student_id, email, dept, program_id, curriculum, f_name, l_name, year, status
 *
 * Optional CSV columns:
 *   m_name, is_transferee, gender, gwa, evaluated, archived
 */
export default function BulkUploadStudent({ onSuccess }) {
  const fileInputRef = useRef(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress animation while uploading
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Gradually increase progress but cap at 90% until actual completion
        if (prev < 90) {
          return prev + Math.random() * 30;
        }
        return prev;
      });
    }, 300);

    try {
      const res = await apiClient.post("/student/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProgress(100);
      setResults(res.data);
      setShowResults(true);
      if (res.data.inserted > 0 && onSuccess) onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail || "Upload failed";
      setResults({ inserted: 0, failed: 0, errors: [], fatalError: detail });
      setShowResults(true);
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      // Reset input so the same file can be re-uploaded after fixing errors
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const header = "student_id,email,dept,program_id,curriculum,f_name,m_name,l_name,year,status,gender,is_transferee";
    const example = "2024-00001,juan@example.com,CCS,BSCS,2022 - 2023,Juan,Santos,Dela Cruz,1,Regular,Male,false";
    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Upload icon button */}
      <FaUpload
        style={{ cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.5 : 1 }}
        title="Bulk Upload Students (CSV)"
        onClick={() => !uploading && setShowTemplate(true)}
      />

      {/* Loading overlay */}
      {uploading &&
        createPortal(
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10000,
            }}
          >
            <div
              style={{
                background: "#fff", borderRadius: 8, padding: "2rem",
                minWidth: 300, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <span
                  style={{
                    display: "inline-block", width: 40, height: 40,
                    border: "4px solid #ecf0f1", borderTop: "4px solid #2c3e50",
                    borderRadius: "50%", animation: "spin 1s linear infinite",
                  }}
                >
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "1.1em", color: "#2c3e50", fontWeight: 500 }}>
                Uploading Students...
              </p>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", color: "#7f8c8d" }}>
                Please wait while we process your CSV
              </p>
            </div>
          </div>,
          document.body
        )}

      {/* Results modal */}
      {showResults &&
        createPortal(
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={() => setShowResults(false)}
          >
            <div
              style={{
                background: "#fff", borderRadius: 8, padding: "2rem",
                minWidth: 380, maxWidth: 560, maxHeight: "80vh",
                overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0 }}>Bulk Upload Results</h3>

              {results?.fatalError ? (
                <p style={{ color: "#c0392b" }}>Error: {results.fatalError}</p>
              ) : (
                <>
                  <p>
                    <strong style={{ color: "#27ae60" }}>✓ Inserted:</strong> {results?.inserted}
                    &nbsp;&nbsp;
                    <strong style={{ color: results?.failed > 0 ? "#c0392b" : "#555" }}>
                      ✗ Failed:
                    </strong>{" "}
                    {results?.failed}
                  </p>

                  {results?.errors?.length > 0 && (
                    <>
                      <p style={{ marginBottom: 4 }}><strong>Errors:</strong></p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#f5f5f5" }}>
                            <th style={thStyle}>Row</th>
                            <th style={thStyle}>Student ID</th>
                            <th style={thStyle}>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.errors.map((err, i) => (
                            <tr key={i}>
                              <td style={tdStyle}>{err.row}</td>
                              <td style={tdStyle}>{err.student_id || "—"}</td>
                              <td style={tdStyle}>{err.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              )}

              <div style={{ marginTop: "1.5rem", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={downloadTemplate} style={secondaryBtn}>
                  Download Template
                </button>
                <button onClick={() => setShowResults(false)} style={primaryBtn}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Template preview modal */}
      {showTemplate &&
        createPortal(
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={() => setShowTemplate(false)}
          >
            <div
              style={{
                background: "#fff", borderRadius: 8, padding: "2rem",
                minWidth: 380, maxWidth: 1200, maxHeight: "80vh",
                overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0 }}>CSV Template</h3>
              <p style={{ color: "#555", marginBottom: "1rem" }}>
                Download the template below or upload your file with these columns:
              </p>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: "1.5rem" }}>
                <thead>
                  <tr style={{ background: "#2d53a6" }}>
                    <th style={thStyle}>student_id</th>
                    <th style={thStyle}>email</th>
                    <th style={thStyle}>dept</th>
                    <th style={thStyle}>program_id</th>
                    <th style={thStyle}>curriculum</th>
                    <th style={thStyle}>f_name</th>
                    <th style={thStyle}>m_name</th>
                    <th style={thStyle}>l_name</th>
                    <th style={thStyle}>year</th>
                    <th style={thStyle}>status</th>
                    <th style={thStyle}>gender</th>
                    <th style={thStyle}>is_transferee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle}>2024-00001</td>
                    <td style={tdStyle}>juan@example.com</td>
                    <td style={tdStyle}>CCS</td>
                    <td style={tdStyle}>BSCS</td>
                    <td style={tdStyle}>2022 - 2023</td>
                    <td style={tdStyle}>Juan</td>
                    <td style={tdStyle}>Santos</td>
                    <td style={tdStyle}>Dela Cruz</td>
                    <td style={tdStyle}>1</td>
                    <td style={tdStyle}>Regular</td>
                    <td style={tdStyle}>Male</td>
                    <td style={tdStyle}>false</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ fontSize: 12, color: "#888" }}>
                <strong>Required fields:</strong> student_id, email, dept, program_id, curriculum, f_name, l_name, year, status, gender, is_transferee
              </p>

              <div style={{ marginTop: "1.5rem", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowTemplate(false)} style={secondaryBtn}>
                  Cancel
                </button>
                <button onClick={downloadTemplate} style={secondaryBtn}>
                  Download Template
                </button>
                <button onClick={() => {
                  setShowTemplate(false);
                  fileInputRef.current?.click();
                }} style={primaryBtn}>
                  Upload CSV
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

const thStyle = {
  padding: "6px 10px", textAlign: "left", borderBottom: "1px solid #ddd",
};
const tdStyle = {
  padding: "5px 10px", borderBottom: "1px solid #f0f0f0", verticalAlign: "top",
};
const primaryBtn = {
  padding: "8px 18px", background: "#2c3e50", color: "#fff",
  border: "none", borderRadius: 4, cursor: "pointer",
};
const secondaryBtn = {
  padding: "8px 18px", background: "#ecf0f1", color: "#2c3e50",
  border: "1px solid #bdc3c7", borderRadius: 4, cursor: "pointer",
};
