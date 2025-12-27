import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        college: "",
    });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await register(form);
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900">
            <form onSubmit={submit} className="bg-gray-800 p-8 rounded w-80 text-white">
                <h1 className="text-xl font-bold mb-6 text-center">Join Campus Beats</h1>

                {["name", "email", "college", "password"].map((f) => (
                    <input
                        key={f}
                        type={f === "password" ? "password" : "text"}
                        placeholder={f}
                        className="w-full p-2 mb-3 bg-gray-700 rounded"
                        onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    />
                ))}

                <button className="w-full bg-indigo-600 py-2 rounded">
                    Register
                </button>

                <p className="mt-4 text-sm text-center">
                    Already registered?{" "}
                    <Link to="/" className="text-indigo-400">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}
