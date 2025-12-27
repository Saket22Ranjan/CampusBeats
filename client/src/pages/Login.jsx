import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Login() {
    const { setUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password,
            });

            setUser(res.data);
        } catch (err) {
            alert("Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] text-white overflow-hidden">

            {/* 🔥 ABSTRACT BLOBS (GRAPHIC ART) */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

            {/* 🔒 LOGIN CARD */}
            <form
                onSubmit={login}
                className="relative z-10 w-[380px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl"
            >
                {/* BRAND */}
                <h1 className="text-3xl font-extrabold text-center tracking-wide">
                    Campus<span className="text-indigo-400">Beats</span>
                </h1>

                <p className="text-center text-sm text-gray-300 mt-2">
                    Where college conversations come alive 🎧
                </p>

                {/* SLOGAN */}
                <p className="text-center text-xs text-gray-400 mt-1 italic">
                    “Connect. Collaborate. Campus.”
                </p>

                {/* FORM */}
                <div className="mt-8 space-y-4">
                    <input
                        type="email"
                        placeholder="College Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-lg bg-white/10 outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-lg bg-white/10 outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-2 rounded-lg font-semibold"
                    >
                        {loading ? "Signing in..." : "Login"}
                    </button>
                </div>

                {/* FOOTER */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    New to CampusBeats?{" "}
                    <Link to="/register" className="text-indigo-400 hover:underline">
                        Create account
                    </Link>
                </p>
            </form>
        </div>
    );
}
