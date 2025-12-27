import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate("/chat");
        } catch (err) {
            alert(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900">
            <form onSubmit={submit} className="bg-gray-800 p-8 rounded w-80 text-white">
                <h1 className="text-2xl font-bold mb-6 text-center">Campus Beats</h1>

                <input
                    className="w-full p-2 mb-4 bg-gray-700 rounded"
                    placeholder="College Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    className="w-full p-2 mb-4 bg-gray-700 rounded"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="w-full bg-indigo-600 py-2 rounded">Login</button>

                <p className="mt-4 text-sm text-center">
                    New here?{" "}
                    <Link to="/register" className="text-indigo-400">
                        Register
                    </Link>
                </p>
            </form>
        </div>
    );
}
