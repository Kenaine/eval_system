import { useState } from "react";
import logo from "../imgs/uphsllogo.png";
import { useNavigate } from "react-router-dom";
import style from "./../style/login.module.css";
import apiClient from "../lib/api";
import { useUser } from "../App";
import { isStudent } from "../lib/auth";

export default function Login() {
    const navigate = useNavigate();
    const [, setCurrentUser] = useUser();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Call backend login endpoint
            const response = await apiClient.post('/auth/login', {
                username: username.trim(),
                password: password
            });
            
            if (response.data?.access_token) {
                // Store token in persistent storage
                localStorage.setItem('supabase_token', response.data.access_token);
                sessionStorage.removeItem('supabase_token');
                
                // Store user profile if available
                if (response.data.profile) {
                    localStorage.setItem('user_profile', JSON.stringify(response.data.profile));
                    sessionStorage.removeItem('user_profile');
                    setCurrentUser(response.data.profile);
                }
                
                // Navigate by role
                navigate(isStudent(response.data?.profile?.role) ? "/curriculum-checklist" : "/new");
            } else {
                setError("Login failed. Please try again.");
            }
        } catch (err) {
            console.error('Login failed:', err);
            
            // Handle error response
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else if (err.response?.status === 401) {
                setError("Invalid username or password");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${style.page} ${style.loginPage}`}>
            <div className={style.login}>
                <header style={{height: '50px', padding: '10px'}}>
                    <b>UNIVERSITY</b>
                </header>
                <div className={style.loginBody}>
                    <div className={`${style.block} ${style.leftBlock}`}>
                        <h1>SIGN IN</h1> <br />
                        <form onSubmit={handleSubmit}>
                            <input
                                required
                                className={style.logForm}
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                placeholder=" USERNAME / STUDENT ID"
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                            /> <br />
                            <input
                                required
                                className={style.logForm}
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                placeholder=" PASSWORD"
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />

                            {/* Show error below password input */}
                            {error && (
                                <div style={{ 
                                    color: 'red', 
                                    marginTop: '10px', 
                                    marginBottom: '10px',
                                    fontSize: '14px',
                                    wordBreak: 'break-word'
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                className={style.logButton}
                                type="submit"
                                disabled={loading}
                            >
                                <b>{loading ? 'SIGNING IN...' : 'SIGN IN'}</b>
                            </button>
                        </form>
                    </div>
                    <div className={style.block}>
                        <h1>
                            <span className={style.welcome}>WELCOME!</span><br />
                            <span className={style.perpetualite}>STUDENT</span>
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
}