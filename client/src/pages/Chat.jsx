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
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    const [unreadMap, setUnreadMap] = useState({});
    const [lastMessageMap, setLastMessageMap] = useState({});

    const bottomRef = useRef(null);

    /* ================= INIT ================= */
    useEffect(() => {
        axios.get("http://localhost:5000/api/users").then(res =>
            setUsers(res.data.filter(u => u._id !== user._id))
        );

        socket.emit("user_online", user._id);

        socket.on("online_users", setOnlineUsers);

        socket.on("receive_private", (msg) => {
            // 🔥 If current chat open
            if (msg.room === currentRoom) {
                setMessages(prev => [...prev, msg]);
                socket.emit("seen_message", {
                    room: currentRoom,
                    userId: user._id,
                });
            } else {
                // 🔥 Update sidebar unread
                setUnreadMap(prev => ({
                    ...prev,
                    [msg.senderId]: (prev[msg.senderId] || 0) + 1,
                }));
            }

            // 🔥 Update last message always
            setLastMessageMap(prev => ({
                ...prev,
                [msg.senderId]: msg.text,
            }));
        });

        socket.on("seen", () => {
            setMessages(prev =>
                prev.map(m =>
                    m.senderId === user._id ? { ...m, seen: true } : m
                )
            );
        });

        return () => socket.off();
    }, [user._id, currentRoom]);

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

        // 🔥 Clear unread
        setUnreadMap(prev => ({ ...prev, [u._id]: 0 }));

        socket.emit("seen_message", { room, userId: user._id });
    };

    /* ================= SEND ================= */
    const sendMessage = (e) => {
        e.preventDefault();
        if (!text || !currentChat) return;

        socket.emit("private_message", {
            room: currentRoom,
            senderId: user._id,
            receiverId: currentChat._id,
            senderName: user.name,
            message: text,
        });

        // 🔥 Update own last message
        setLastMessageMap(prev => ({
            ...prev,
            [currentChat._id]: text,
        }));

        setText("");
    };

    const time = (t) =>
        new Date(t).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="h-screen flex bg-gradient-to-br from-[#0f172a] to-[#020617] text-white">

            {/* ===== SIDEBAR ===== */}
            <div className="w-[300px] bg-[#020617]/80 p-4 flex flex-col border-r border-white/10">
                <h1 className="text-xl font-bold mb-4">
                    Campus<span className="text-indigo-400">Beats</span>
                </h1>

                <div className="flex-1 space-y-1">
                    {users.map(u => {
                        const isOnline = onlineUsers.includes(u._id);
                        const active = currentChat?._id === u._id;
                        const unread = unreadMap[u._id] || 0;
                        const lastMsg = lastMessageMap[u._id];

                        return (
                            <div
                                key={u._id}
                                onClick={() => openChat(u)}
                                className={`px-3 py-2 rounded-xl cursor-pointer transition
                  ${active ? "bg-indigo-500/20" : "hover:bg-white/5"}`}
                            >
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{u.name}</p>
                                    {unread > 0 && (
                                        <span className="bg-green-500 text-black text-xs px-2 rounded-full">
                                            {unread}
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-400 truncate">
                                    {lastMsg || (isOnline ? "Online" : "Offline")}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={logout}
                    className="mt-4 bg-red-500/80 hover:bg-red-600 py-2 rounded-xl"
                >
                    Logout
                </button>
            </div>

            {/* ===== CHAT ===== */}
            <div className="flex-1 flex flex-col">
                {currentChat ? (
                    <>
                        {/* HEADER */}
                        <div className="h-16 px-6 flex items-center gap-4 bg-[#020617]/80 border-b border-white/10">
                            <p className="font-semibold">{currentChat.name}</p>
                        </div>

                        {/* MESSAGES */}
                        <div className="flex-1 px-6 py-4 overflow-y-auto space-y-3">
                            {messages.map(m => {
                                const isMe = String(m.senderId) === String(user._id);
                                return (
                                    <div
                                        key={m._id}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-3 rounded-2xl
                        ${isMe
                                                    ? "bg-indigo-500 rounded-br-none"
                                                    : "bg-white/10 rounded-bl-none"}`}
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

                        {/* INPUT */}
                        <form
                            onSubmit={sendMessage}
                            className="h-16 px-6 flex items-center gap-3 bg-[#020617]/80 border-t border-white/10"
                        >
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="flex-1 bg-white/10 rounded-full px-5 py-2 outline-none"
                                placeholder={`Message ${currentChat.name}`}
                            />
                            <button className="bg-indigo-600 px-5 py-2 rounded-full">
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    );
}
