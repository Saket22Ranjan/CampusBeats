import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/api/auth/register", form);
            alert("Account created. Please login.");
        } catch {
            alert("Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] to-[#0f172a] text-white">
            <form
                onSubmit={submit}
                className="w-[380px] bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-xl"
            >
                <h1 className="text-3xl font-extrabold text-center">
                    Join <span className="text-indigo-400">CampusBeats</span>
                </h1>
                <p className="text-center text-gray-400 mt-2">
                    College conversations, simplified 🎓
                </p>

                <div className="mt-6 space-y-4">
                    {["name", "email", "password"].map((field) => (
                        <input
                            key={field}
                            type={field === "password" ? "password" : "text"}
                            placeholder={field.toUpperCase()}
                            className="w-full px-4 py-2 bg-white/10 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={(e) =>
                                setForm({ ...form, [field]: e.target.value })
                            }
                            required
                        />
                    ))}

                    <button className="w-full bg-indigo-600 py-2 rounded font-semibold">
                        Create Account
                    </button>
                </div>

                <p className="text-center text-sm text-gray-400 mt-4">
                    Already registered?{" "}
                    <Link to="/" className="text-indigo-400 hover:underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}
