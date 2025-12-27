import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Chat() {
    const { user, logout } = useAuth();
    const { toggleTheme } = useTheme();

    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [unread, setUnread] = useState({});

    const bottomRef = useRef(null);

    /* ================= INIT ================= */
    useEffect(() => {
        axios.get("http://localhost:5000/api/users").then((res) => {
            setUsers(res.data.filter((u) => u._id !== user._id));
        });

        socket.emit("user_online", user._id);

        socket.on("online_users", setOnlineUsers);

        socket.on("receive_private", (msg) => {
            const isCurrentChatOpen =
                currentChat && msg.senderId === currentChat._id;

            if (isCurrentChatOpen) {
                setMessages((prev) => [...prev, msg]);
                socket.emit("seen_message", { room: msg.room, userId: user._id });
            } else {
                setUnread((prev) => ({
                    ...prev,
                    [msg.senderId]: (prev[msg.senderId] || 0) + 1,
                }));
            }
        });

        socket.on("seen", () => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.senderId === user._id ? { ...m, seen: true } : m
                )
            );
        });

        return () => socket.off();
    }, [user._id, currentChat]);

    /* ================= AUTO SCROLL ================= */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ================= OPEN CHAT ================= */
    const openChat = async (u) => {
        setCurrentChat(u);

        const room = [user._id, u._id].sort().join("_");
        setCurrentRoom(room);

        socket.emit("join_private", { room });

        const res = await axios.get(
            `http://localhost:5000/api/messages/${room}`
        );
        setMessages(res.data);

        socket.emit("seen_message", { room, userId: user._id });

        setUnread((prev) => ({ ...prev, [u._id]: 0 }));
    };

    /* ================= SEND ================= */
    const sendMessage = (e) => {
        e.preventDefault();
        if (!text || !currentChat) return;

        const newMsg = {
            _id: Date.now(),
            room: currentRoom,
            senderId: user._id,
            receiverId: currentChat._id,
            message: text,
            createdAt: new Date(),
            seen: false,
        };

        setMessages((prev) => [...prev, newMsg]);
        socket.emit("private_message", newMsg);
        setText("");
    };

    const time = (t) =>
        new Date(t).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    /* ================= UI ================= */
    return (
        <div className="h-screen flex bg-gradient-to-br from-[#020617] to-[#0f172a] text-white">

            {/* SIDEBAR (MOBILE + DESKTOP) */}
            <div
                className={`w-full md:w-[300px] bg-[#020617]/90 border-r border-white/10 p-4 flex flex-col
        ${currentChat ? "hidden md:flex" : "flex"}`}
            >
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">
                        Campus<span className="text-indigo-400">Beats</span>
                    </h1>
                    <button onClick={toggleTheme} className="bg-white/10 px-2 py-1 rounded">
                        🌗
                    </button>
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto">
                    {users.map((u) => (
                        <div
                            key={u._id}
                            onClick={() => openChat(u)}
                            className="flex items-center px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5"
                        >
                            <div>
                                <p className="font-medium">{u.name}</p>
                                <p className="text-xs text-gray-400">
                                    {onlineUsers.includes(u._id) ? "Online" : "Offline"}
                                </p>
                            </div>

                            {unread[u._id] > 0 && (
                                <span className="ml-auto bg-green-500 text-xs px-2 py-0.5 rounded-full">
                                    {unread[u._id]}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    onClick={logout}
                    className="mt-4 bg-red-500/80 hover:bg-red-600 py-2 rounded-xl"
                >
                    Logout
                </button>
            </div>

            {/* CHAT AREA */}
            <div
                className={`flex-1 flex flex-col ${currentChat ? "flex" : "hidden md:flex"
                    }`}
            >
                {currentChat ? (
                    <>
                        {/* HEADER */}
                        <div className="h-14 px-4 flex items-center gap-3 bg-[#020617]/90 border-b border-white/10">
                            {/* MOBILE BACK */}
                            <button
                                onClick={() => setCurrentChat(null)}
                                className="md:hidden text-xl"
                            >
                                ←
                            </button>
                            <p className="font-semibold">{currentChat.name}</p>
                        </div>

                        {/* MESSAGES */}
                        <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3">
                            {messages.map((m) => {
                                const isMe = String(m.senderId) === String(user._id);
                                const textMsg = m.message || m.text;

                                return (
                                    <div
                                        key={m._id}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm
                        ${isMe
                                                    ? "bg-indigo-500 rounded-br-none"
                                                    : "bg-white/10 rounded-bl-none"}`}
                                        >
                                            <p>{textMsg}</p>
                                            <div className="flex justify-end gap-1 text-[10px] opacity-70 mt-1">
                                                <span>{time(m.createdAt)}</span>
                                                {isMe && <span>{m.seen ? "✔✔" : "✔"}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* INPUT */}
                        <form
                            onSubmit={sendMessage}
                            className="h-14 px-4 flex items-center gap-2 bg-[#020617]/90 border-t border-white/10"
                        >
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm outline-none"
                                placeholder={`Message ${currentChat.name}`}
                            />
                            <button className="bg-indigo-600 px-4 py-2 rounded-full text-sm">
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 hidden md:flex items-center justify-center text-gray-500">
                        Select a chat
                    </div>
                )}
            </div>
        </div>
    );
}
