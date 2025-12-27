import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState(user.name);
    const [college, setCollege] = useState(user.college);

    const save = async () => {
        await axios.put(`http://localhost:5000/api/users/${user._id}`, {
            name,
            college,
        });
        alert("Profile updated");
        navigate("/chat");
    };

    return (
        <div className="h-screen bg-gray-900 text-white p-8">
            <h1 className="text-2xl mb-4">My Profile</h1>

            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block mb-3 p-2 bg-gray-700"
            />

            <input
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="block mb-3 p-2 bg-gray-700"
            />

            <button onClick={save} className="bg-indigo-600 px-4 py-2 rounded">
                Save
            </button>
        </div>
    );
}
