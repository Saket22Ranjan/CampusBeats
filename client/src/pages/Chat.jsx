import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Chat() {
    const { user, logout } = useAuth();

    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    const bottomRef = useRef(null);

    /* ================= INIT ================= */
    useEffect(() => {
        axios.get("http://localhost:5000/api/users").then(res =>
            setUsers(res.data.filter(u => u._id !== user._id))
        );

        socket.emit("user_online", user._id);

        socket.on("online_users", setOnlineUsers);

        socket.on("receive_private", (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on("seen", () => {
            setMessages(prev =>
                prev.map(m =>
                    m.senderId === user._id ? { ...m, seen: true } : m
                )
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

        socket.emit("seen_message", { room, userId: user._id });
    };

    /* ================= SEND ================= */
    const sendMessage = (e) => {
        e.preventDefault();
        if (!text || !currentChat) return;

        const room = [user._id, currentChat._id].sort().join("_");

        socket.emit("private_message", {
            room,
            senderId: user._id,
            receiverId: currentChat._id,
            senderName: user.name,
            message: text,
        });

        setText("");
    };

    const time = (t) =>
        new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="h-screen flex bg-gray-900 text-white">

            {/* ================= SIDEBAR ================= */}
            <div className="w-1/4 bg-gray-800 p-4">
                {users.map(u => {
                    const isOnline = onlineUsers.includes(u._id);

                    return (
                        <div
                            key={u._id}
                            onClick={() => openChat(u)}
                            className={`p-2 rounded cursor-pointer ${currentChat?._id === u._id
                                    ? "bg-gray-700"
                                    : "hover:bg-gray-700"
                                }`}
                        >
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-gray-400">
                                {isOnline ? "Online" : "Offline"}
                            </p>
                        </div>
                    );
                })}

                <button
                    onClick={logout}
                    className="mt-4 bg-red-500 w-full py-1 rounded"
                >
                    Logout
                </button>
            </div>

            {/* ================= CHAT ================= */}
            <div className="flex-1 flex flex-col">

                {/* ===== CHAT HEADER (NEW) ===== */}
                {currentChat ? (
                    <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-3">
                        <img
                            src={`https://ui-avatars.com/api/?name=${currentChat.name}`}
                            className="w-10 h-10 rounded-full"
                        />
                        <div>
                            <p className="font-semibold">{currentChat.name}</p>
                            <p className="text-xs text-gray-400">
                                {onlineUsers.includes(currentChat._id)
                                    ? "Online"
                                    : "Offline"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Select a chat to start messaging
                    </div>
                )}

                {/* ===== MESSAGES ===== */}
                <div className="flex-1 p-4 overflow-y-auto space-y-2">
                    {messages.map(m => {
                        const isMe = String(m.senderId) === String(user._id);

                        return (
                            <div
                                key={m._id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`p-3 rounded max-w-xs ${isMe ? "bg-green-500" : "bg-gray-700"
                                        }`}
                                >
                                    <p>{m.text}</p>
                                    <div className="flex justify-end gap-1 text-xs opacity-70">
                                        <span>{time(m.createdAt)}</span>
                                        {isMe && <span>{m.seen ? "✔✔" : "✔"}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* ===== INPUT ===== */}
                {currentChat && (
                    <form
                        onSubmit={sendMessage}
                        className="p-3 bg-gray-800 flex gap-2"
                    >
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="flex-1 p-2 rounded bg-gray-700"
                            placeholder={`Message ${currentChat.name}`}
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
