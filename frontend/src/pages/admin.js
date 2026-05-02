import React, { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../style/checklist.module.css";

import HeaderWebsite from "../component/header";

import { useUser } from "../App";
import { API_URL } from "../misc/url";
import { isAdmin } from "../lib/auth";

export default function AdminManagement() {
    const pageName = "Admin Management";
    const navigate = useNavigate();
    const SELECTED_ADMIN_KEY = "selected_admin_username";
    const SELECTED_ADMIN_DATA_KEY = "selected_admin_data";

    const readCachedJson = (key, fallbackValue) => {
        const raw = sessionStorage.getItem(key);
        if (!raw) {
            return fallbackValue;
        }

        try {
            return JSON.parse(raw);
        } catch {
            sessionStorage.removeItem(key);
            return fallbackValue;
        }
    };

    const [currentUser, setCurrentUser] = useUser();
    const [selectedAdmin, setSelectedAdmin] = useState(() => readCachedJson(SELECTED_ADMIN_DATA_KEY, null));
    const [isViewing, setIsViewing] = useState(() => {
        const cachedAdmin = readCachedJson(SELECTED_ADMIN_DATA_KEY, null);
        return Boolean(cachedAdmin?.username);
    });
    const adminView = isAdmin(currentUser?.role);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchAdmins = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Search for admins by username or full_name
            const res = await axios.get(`${API_URL}/auth/admins/search`, {
                params: { query },
                withCredentials: true,
            });

            
            setSearchResults(res.data.admins || []);

            console.log(searchResults);
        } catch (err) {
            console.error("Search failed:", err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAdminSelect = async (username) => {
        try {
            const res = await axios.get(`${API_URL}/auth/admin/${username}`, {
                withCredentials: true,
            });
            
            if (res.data && res.data.username) {
                setSelectedAdmin(res.data);
                setIsViewing(true);
                sessionStorage.setItem(SELECTED_ADMIN_KEY, username);
                sessionStorage.setItem(SELECTED_ADMIN_DATA_KEY, JSON.stringify(res.data));
                setSearchResults([]);
            } else {
                console.error("Invalid response format:", res.data);
                alert("Failed to load admin data");
            }
        } catch (err) {
            console.error("Failed to fetch admin details: ", err);
            alert(`Error: ${err.response?.data?.detail || err.message || "Failed to load admin"}`);
        }
    };

    const deleteAdmin = async () => {
        if (!selectedAdmin?.username) {
            alert("No admin selected.");
            return;
        }

        if (selectedAdmin.username === currentUser?.user_id) {
            alert("You cannot delete your own admin account.");
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete admin ${selectedAdmin.full_name || selectedAdmin.username}?`
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await axios.delete(
                `${API_URL}/auth/admin/${selectedAdmin.username}`,
                { withCredentials: true }
            );

            setSelectedAdmin(null);
            setIsViewing(false);
            sessionStorage.removeItem(SELECTED_ADMIN_KEY);
            sessionStorage.removeItem(SELECTED_ADMIN_DATA_KEY);

            alert("Admin deleted successfully.");
        } catch (err) {
            console.error("Delete failed:", err);
            const errorMsg = err.response?.data?.detail || err.message || "Failed to delete admin";
            alert(`Error deleting admin: ${errorMsg}`);
        }
    };

    // Auto-load cached admin data if available
    useEffect(() => {
        const savedAdminUsername = sessionStorage.getItem(SELECTED_ADMIN_KEY);
        if (savedAdminUsername) {
            handleAdminSelect(savedAdminUsername);
        }
    }, []);


    return (
        <div className={style.curChecklist}>
            <HeaderWebsite pageName={pageName} />

            <div className={style.studentBody}>
                {adminView && (
                    <div className={style.studentSearchBarWrapper}>
                        <input
                            type="text"
                            placeholder="Search admins by username or name..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchAdmins(e.target.value);
                            }}
                            style={{
                                width: "100%",
                                padding: "10px",
                                fontSize: "14px",
                                border: "1px solid #ccc",
                                borderRadius: "4px"
                            }}
                        />
                        {searchResults.length > 0 && (
                            <div style={{
                                marginTop: "10px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                maxHeight: "300px",
                                overflowY: "auto"
                            }}>
                                {searchResults.map((admin) => (
                                    <div
                                        key={admin.username}
                                        onClick={() => handleAdminSelect(admin.full_name)}
                                        style={{
                                            padding: "10px",
                                            borderBottom: "1px solid #eee",
                                            cursor: "pointer",
                                            backgroundColor: selectedAdmin?.username === admin.username ? "#e3f2fd" : "white",
                                            transition: "background-color 0.2s"
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                                        onMouseOut={(e) => e.target.style.backgroundColor = selectedAdmin?.username === admin.username ? "#e3f2fd" : "white"}
                                    >
                                        <strong>{admin.username}</strong> - {admin.full_name || "N/A"}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className={style.studentDetail}>
                    <h3>
                        Admin Information
                        <span className={style.buttons}>
                            {adminView && isViewing && (
                                <FaTrash 
                                    className={`${style.editIcon} ${!isViewing ? style.disabled: ""}`}
                                    style={{
                                        color: "#de0000",
                                        cursor: "pointer"
                                    }}
                                    title="Delete Admin"
                                    onClick={deleteAdmin}
                                />
                            )}
                        </span>
                    </h3>

                    {isViewing && selectedAdmin ? (
                        <div className={style.studentResidency}>
                            <div className={style.lBlock}>
                                <span>Admin Username: {selectedAdmin?.username ?? "N/A"}</span>
                                <span>
                                    Admin Name: {selectedAdmin?.full_name ?? "N/A"}
                                </span>
                                <span>Email: {selectedAdmin?.email ?? "N/A"}</span>
                            </div>
                            <div className={style.rBlock}>
                                <span>Role: {selectedAdmin?.role ?? "N/A"}</span>
                                <span>Created: {selectedAdmin?.created_at ? new Date(selectedAdmin.created_at).toLocaleDateString() : "N/A"}</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                            Select an admin to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}