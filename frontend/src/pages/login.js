import { useState } from "react";
import logo from "../imgs/uphsllogo.png";
import { useNavigate } from "react-router-dom";
import style from "./../style/login.module.css";
import { authHelpers } from "../lib/supabase";

export default function Login() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: signInError } = await authHelpers.signIn(`${studentId.trim()}@uphsl.edu.ph`, password);
            
            if (signInError) {
                setError(signInError.message);
                console.error('Login failed:', signInError);
                return;
            }

            if (data?.session) {
                sessionStorage.setItem('supabase_token', data.session.access_token);
                navigate("/new");
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError("An unexpected error occurred. Please try again.");
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
                                id="studentId"
                                name="studentId"
                                value={studentId}
                                placeholder=" STUDENT NUMBER"
                                onChange={(e) => setStudentId(e.target.value)}
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
                                <div style={{ color: 'red', marginTop: '10px', marginBottom: '-10px' }}>
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