import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUserState] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUserState(JSON.parse(storedUser));
        }
    }, []);

    const setUser = (userData) => {
        localStorage.setItem("user", JSON.stringify(userData));
        setUserState(userData);
    };

    const logout = () => {
        localStorage.removeItem("user");
        setUserState(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
