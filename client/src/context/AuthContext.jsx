import { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );

    const login = async (email, password) => {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
            email,
            password,
        });
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const register = async (data) => {
        await axios.post("http://localhost:5000/api/auth/register", data);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
