import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { createPortal } from "react-dom";
import apiClient from "../../lib/api";
import { API_URL } from "../../misc/url";

export default function EditAdmin({ admin, onAdminUpdated }) {
  let title = "Edit Admin";
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: admin?.username || "",
    email: admin?.email || "",
    full_name: admin?.full_name || "",
    password: "",
    confirmPassword: "",
    role: admin?.role || "admin",
  });
  const [error, setError] = useState("");
  
  // Update form when admin prop changes
  useEffect(() => {
    if (admin) {
      setFormData({
        username: admin.username || "",
        email: admin.email || "",
        full_name: admin.full_name || "",
        password: "",
        confirmPassword: "",
        role: admin.role || "admin",
      });
    }
  }, [admin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.full_name.trim()) {
      setError("Full name is required");
      return false;
    }
    // Password is optional for edit - only validate if user entered one
    if (formData.password) {
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
      };

      // Only include password if user entered one
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await axios.put(
        `${API_URL}/auth/admin-update/${admin.username}`,
        updateData,
        { withCredentials: true }
      );

      alert("Admin updated successfully!");
      setShowModal(false);
      
      // Notify parent component
      if (onAdminUpdated) {
        onAdminUpdated(response.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to update admin";
      setError(errorMsg);
      console.error("Error updating admin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  return (
    <>
      <FaEdit
        style={{ cursor: "pointer" }}
        title="Edit Admin"
        onClick={() => setShowModal(true)}
      />
      {showModal &&
        createPortal(
          <div
            style={{
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
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "8px",
                width: "90%",
                maxWidth: "500px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{title}</h2>
              {error && (
                <div
                  style={{
                    color: "#d32f2f",
                    marginBottom: "15px",
                    padding: "10px",
                    backgroundColor: "#ffebee",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                    Username:
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                    Full Name:
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                    Role:
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="super admin">Super Admin</option>
                  </select>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                    Password:
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave empty to keep current password"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                    Confirm Password:
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: isLoading ? "#ccc" : "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {isLoading ? "Updating..." : "Update Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}