import React, {useState} from "react";

export default function AddCurriculumModal({programs, selectedProgram, handleAddCurriculum, setShowAddCurriculumModal}){
    const [newCurriculumName, setNewCurriculumName] = useState("");

    function addCurriculum(){
        handleAddCurriculum(newCurriculumName);
        setNewCurriculumName("");
    };

    
    return(
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "8px",
                maxWidth: "500px",
                width: "90%",
            }}>
                <h2>Create Curriculum</h2>
                
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        Program:
                    </label>
                    <input
                        type="text"
                        disabled
                        value={
                            selectedProgram
                        }
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            fontSize: "1rem",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            boxSizing: "border-box",
                            backgroundColor: "#f0f0f0",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        Curriculum Name:
                    </label>
                    <input
                        type="text"
                        value={newCurriculumName}
                        onChange={(e) => setNewCurriculumName(e.target.value)}
                        placeholder="Enter curriculum name"
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            fontSize: "1rem",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            boxSizing: "border-box",
                        }}
                        onKeyPress={(e) => {
                            if (e.key === "Enter") {
                                addCurriculum();
                            }
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                    <button
                        onClick={() => {
                            setShowAddCurriculumModal(false);
                            setNewCurriculumName("");
                        }}
                        style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={addCurriculum}
                        style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#FF9800",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
