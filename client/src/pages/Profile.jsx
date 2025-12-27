import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    /* 🔥 Initialize ONCE */
    const [form, setForm] = useState(() => ({
        name: user?.name || "",
        college: user?.college || "",
        course: user?.course || "",
        branch: user?.branch || "",
        year: user?.year || "",
        phone: user?.phone || "",
    }));

    /* 🔥 ONLY redirect guard, NO setState */
    useEffect(() => {
        if (!user || !user._id) {
            navigate("/");
        }
    }, [user, navigate]);

    const save = async (e) => {
        e.preventDefault();

        const res = await axios.put(
            `http://localhost:5000/api/users/${user._id}`,
            form
        );

        setUser(res.data);
        navigate("/chat");
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] to-[#0f172a] text-white">
            <form
                onSubmit={save}
                className="w-[420px] bg-white/10 backdrop-blur-xl p-8 rounded-2xl space-y-4"
            >
                <h1 className="text-2xl font-bold text-center">
                    Complete Your Profile 🎓
                </h1>

                {Object.keys(form).map((key) => (
                    <input
                        key={key}
                        placeholder={key.toUpperCase()}
                        value={form[key]}
                        onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                        }
                        className="w-full p-2 rounded bg-white/10 outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                ))}

                <button className="w-full bg-indigo-600 py-2 rounded-xl font-medium">
                    Save & Continue
                </button>
            </form>
        </div>
    );
}
