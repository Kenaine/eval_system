import React, {useState} from "react";

export default function AddProgramModal({handleAddProgram, setShowAddProgramModal}){
    const [newProgramName, setNewProgramName] = useState("");
    const [newProgramID, setNewProgramID] = useState("");
    const [newSpecialization, setNewSpecialization] = useState("");

    function addProgram(){
        handleAddProgram(newProgramName, newProgramID, newSpecialization);
        setNewProgramName("");
        setNewProgramID("");
        setNewSpecialization("");
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
                <h2>Add Program</h2>
                
                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        Program ID:
                    </label>
                    <input
                        type="text"
                        value={newProgramID}
                        onChange={(e) => setNewProgramID(e.target.value)}
                        placeholder="Enter program ID"
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            fontSize: "1rem",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        Program Name:
                    </label>
                    <input
                        type="text"
                        value={newProgramName}
                        onChange={(e) => setNewProgramName(e.target.value)}
                        placeholder="Enter program name"
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            fontSize: "1rem",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            boxSizing: "border-box",
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                addProgram();
                            }
                        }}
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                        Specialization (Optional):
                    </label>
                    <input
                        type="text"
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        placeholder="Enter specialization (optional)"
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            fontSize: "1rem",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                    <button
                        onClick={() => {
                            setShowAddProgramModal(false);
                            setNewProgramName("");
                            setNewProgramID("");
                            setNewSpecialization("");
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
                        onClick={addProgram}
                        style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#2196F3",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
