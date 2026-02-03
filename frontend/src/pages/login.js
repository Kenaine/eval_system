import { useState } from "react";
import logo from "../imgs/uphsllogo.png";
import { useNavigate } from "react-router-dom";
import style from "./../style/login.module.css";

export default function Login({checkCredential}) {
    const navigate = useNavigate();
    const [login_id, setLoginID] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');


    const handleSubmit = async (e) => {
        try{
            e.preventDefault(); // Prevent form from reloading page
            const success = await checkCredential(login_id, password);
            if (!success){
                setError("Invalid login credentials");
                throw new Error("Invalid login credentials");
            }

            navigate("/new");
        }
        catch (err){
            console.error('Login failed: ', err.response?.data || err.message);
            setError("Invalid login credentials");
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
                                id="login_id"
                                name="login_id"
                                value={login_id}
                                placeholder=" STUDENT NUMBER"
                                onChange={(e) => setLoginID(e.target.value)}
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
                            >
                                <b>SIGN IN</b>
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