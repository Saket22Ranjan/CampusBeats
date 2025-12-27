import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { uploadFile } from "../services/upload";

const socket = io("http://localhost:5000");

export default function Chat() {
    const { user, logout } = useAuth();

    const [users, setUsers] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    const bottomRef = useRef(null);

    /* ================= INIT ================= */
    useEffect(() => {
        axios.get("http://localhost:5000/api/users").then(res =>
            setUsers(res.data.filter(u => u._id !== user._id))
        );

        socket.on("receive_private", (msg) => {
            // 🔥 duplicate prevention
            setMessages(prev => {
                const exists = prev.some(
                    m =>
                        m.senderId === msg.senderId &&
                        m.text === msg.text &&
                        Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 1500
                );
                if (exists) return prev;
                return [...prev, msg];
            });
        });

        socket.on("seen", () => {
            setMessages(prev =>
                prev.map(m => ({ ...m, seen: true }))
            );
        });

        return () => socket.off();
    }, [user._id]);

    /* ================= AUTO SCROLL ================= */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ================= OPEN CHAT ================= */
    const openChat = async (u) => {
        setCurrentChat(u);

        const room = [user._id, u._id].sort().join("_");
        socket.emit("join_private", { room });

        const res = await axios.get(
            `http://localhost:5000/api/messages/${room}`
        );
        setMessages(res.data);

        socket.emit("seen_message", {
            room,
            userId: user._id,
        });
    };

    /* ================= SEND TEXT (OPTIMISTIC) ================= */
    const sendMessage = (e) => {
        e.preventDefault();
        if (!text || !currentChat) return;

        const room = [user._id, currentChat._id].sort().join("_");

        // 🔥 optimistic message (instant UI)
        const optimisticMsg = {
            _id: Date.now(),
            room,
            senderId: user._id,
            receiverId: currentChat._id,
            senderName: user.name,
            text,
            seen: false,
            createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMsg]);

        socket.emit("private_message", {
            room,
            senderId: user._id,
            receiverId: currentChat._id,
            senderName: user.name,
            message: text,
        });

        setText("");
    };

    /* ================= SEND FILE ================= */
    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentChat) return;

        const uploaded = await uploadFile(file);
        const room = [user._id, currentChat._id].sort().join("_");

        const optimisticMsg = {
            _id: Date.now(),
            room,
            senderId: user._id,
            receiverId: currentChat._id,
            senderName: user.name,
            text: uploaded.url,
            mediaType: uploaded.type,
            seen: false,
            createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMsg]);

        socket.emit("private_message", {
            room,
            senderId: user._id,
            receiverId: currentChat._id,
            senderName: user.name,
            message: uploaded.url,
            mediaType: uploaded.type,
        });
    };

    const time = (t) =>
        new Date(t).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    /* ================= UI ================= */
    return (
        <div className="h-screen flex bg-gray-900 text-white">

            {/* USERS */}
            <div className="w-1/4 bg-gray-800 p-4">
                {users.map(u => (
                    <div
                        key={u._id}
                        onClick={() => openChat(u)}
                        className={`p-2 rounded cursor-pointer ${currentChat?._id === u._id
                                ? "bg-gray-700"
                                : "hover:bg-gray-700"
                            }`}
                    >
                        <b>{u.name}</b>
                    </div>
                ))}

                <button
                    onClick={logout}
                    className="mt-4 bg-red-500 w-full py-1 rounded"
                >
                    Logout
                </button>
            </div>

            {/* CHAT */}
            <div className="flex-1 flex flex-col">

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.map(m => {
                        const isMe = String(m.senderId) === String(user._id);

                        return (
                            <div
                                key={m._id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-xs p-3 rounded-2xl ${isMe
                                            ? "bg-green-500 text-white rounded-br-none"
                                            : "bg-gray-700 rounded-bl-none"
                                        }`}
                                >
                                    {m.mediaType === "image" ? (
                                        <img
                                            src={m.text}
                                            className="rounded mb-1 max-w-[200px]"
                                        />
                                    ) : (
                                        <p>{m.text}</p>
                                    )}

                                    <div className="flex justify-end items-center gap-1 text-xs opacity-70 mt-1">
                                        <span>{time(m.createdAt)}</span>
                                        {isMe && (
                                            <span className="text-green-200">
                                                {m.seen ? "✔✔" : "✔"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {currentChat && (
                    <form
                        onSubmit={sendMessage}
                        className="p-3 bg-gray-800 flex gap-2 items-center"
                    >
                        <label className="cursor-pointer">
                            📎
                            <input type="file" hidden onChange={handleFile} />
                        </label>

                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="flex-1 p-2 rounded bg-gray-700"
                            placeholder="Type a message"
                        />

                        <button className="bg-indigo-600 px-4 rounded">
                            Send
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
