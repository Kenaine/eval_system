import { useEffect, useRef, useState } from "react";
import { FaHome, FaChartLine, FaList, FaClipboardCheck, FaBook, FaGraduationCap, FaUserCircle, FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import style from "../style/header.module.css"
import { useUser } from "../App";
import { isStudent } from "../lib/auth";
import apiClient from "../lib/api";

const MIN_PASSWORD_LENGTH = 8;

export default function HeaderWebsite({ pageName }){
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useUser() || [];
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordError, setPasswordError] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const profileMenuRef = useRef(null);
    const pageList = [
        { link: "New Checklist", path: "/new", icon: FaHome, label: "Home" }, 
        { link: "Dashboard", path: "/dashboard", icon: FaChartLine, label: "Dashboard" }, 
        { link: "Curriculum Checklist", path: "/curriculum-checklist", icon: FaClipboardCheck, label: "Checklist" },
        { link: "Course List", path: "/course-list", icon: FaBook, label: "Courses" },
        { link: "Curriculum List", path: "/curriculum-list", icon: FaGraduationCap, label: "Curriculum" },
        { link: "Admin Page", path: "/admin-page", icon: FaPen, label: "Admin"}
    ];
    const visiblePages = isStudent(currentUser?.role)
        ? pageList.filter((page) => page.path === "/curriculum-checklist")
        : pageList;

    const signOut = () => {
        localStorage.removeItem('supabase_token');
        localStorage.removeItem('user_profile');
        sessionStorage.removeItem('supabase_token');
        sessionStorage.removeItem('user_profile');
        sessionStorage.removeItem('programs');
        setCurrentUser?.(null);
        window.location.replace("/");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openChangePasswordModal = () => {
        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setPasswordError("");
        setIsProfileMenuOpen(false);
        setIsPasswordModalOpen(true);
    };

    const closeChangePasswordModal = () => {
        if (isChangingPassword) {
            return;
        }
        setIsPasswordModalOpen(false);
    };

    const handlePasswordInputChange = (event) => {
        const { name, value } = event.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();
        const username = currentUser?.username;

        if (!username) {
            setPasswordError("Unable to determine current user.");
            return;
        }

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordError("Please fill out all fields.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        if (passwordForm.newPassword.length < MIN_PASSWORD_LENGTH) {
            setPasswordError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }

        setPasswordError("");
        setIsChangingPassword(true);

        try {
            const loginResponse = await apiClient.post("/auth/login", {
                username,
                password: passwordForm.currentPassword,
            });

            if (!loginResponse.data?.access_token) {
                setPasswordError("Current password is incorrect.");
                return;
            }

            await apiClient.post(`/auth/edit-password/${encodeURIComponent(username)}`, {
                new_password: passwordForm.newPassword,
            });

            alert("Password changed successfully.");
            setIsPasswordModalOpen(false);
        } catch (error) {
            setPasswordError(error.response?.data?.detail || "Failed to change password.");
        } finally {
            setIsChangingPassword(false);
        }
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

            <div className={style.profileMenu} ref={profileMenuRef}>
                <button
                    className={style.profileButton}
                    type="button"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    title="Profile"
                >
                    <FaUserCircle />
                </button>

                {isProfileMenuOpen && (
                    <div className={style.dropdownMenu}>
                        <button type="button" className={style.dropdownItem} onClick={openChangePasswordModal}>
                            Change Password
                        </button>
                        <button
                            type="button"
                            className={style.dropdownItem}
                            onClick={() => {
                                setIsProfileMenuOpen(false);
                                signOut();
                            }}
                        >
                            Log out
                        </button>
                    </div>
                )}
            </div>

            {isPasswordModalOpen && (
                <div className={style.passwordModalOverlay}>
                    <div className={style.passwordModal}>
                        <h3>Change Password</h3>
                        <p className={style.passwordHint}>
                            New password must be at least {MIN_PASSWORD_LENGTH} characters.
                        </p>
                        <form onSubmit={handleChangePassword} className={style.passwordForm}>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Current Password"
                                disabled={isChangingPassword}
                            />
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="New Password"
                                minLength={MIN_PASSWORD_LENGTH}
                                disabled={isChangingPassword}
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordInputChange}
                                placeholder="Confirm New Password"
                                disabled={isChangingPassword}
                            />

                            {passwordError && <p className={style.passwordError}>{passwordError}</p>}

                            <div className={style.passwordModalActions}>
                                <button type="button" onClick={closeChangePasswordModal} disabled={isChangingPassword}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={isChangingPassword}>
                                    {isChangingPassword ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
}