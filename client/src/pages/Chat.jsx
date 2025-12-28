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

  // image states
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();

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
      const isCurrent =
        currentChat && msg.senderId === currentChat._id;

      if (isCurrent) {
        setMessages((prev) => [...prev, msg]);

        socket.emit("seen_message", {
          room: msg.room,
          userId: user._id,
        });
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

    socket.emit("seen_message", {
      room,
      userId: user._id,
    });

    setUnread((prev) => ({ ...prev, [u._id]: 0 }));
  };

  /* ================= IMAGE SELECT ================= */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ================= SEND ================= */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text && !image) return;

    let imageUrl = null;

    if (image) {
      const formData = new FormData();
      formData.append("image", image);

      const uploadRes = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      imageUrl = uploadRes.data.imageUrl;
    }

    const newMsg = {
      _id: Date.now(),
      room: currentRoom,
      senderId: user._id,
      receiverId: currentChat._id,
      text,
      image: imageUrl, // 🔥 IMPORTANT
      createdAt: new Date(),
      seen: false,
    };

    // optimistic
    setMessages((prev) => [...prev, newMsg]);
    socket.emit("private_message", newMsg);

    setText("");
    setImage(null);
    setImagePreview(null);
  };

  const time = (t) =>
    new Date(t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#020617] to-[#0f172a] text-white relative">

      {/* IMAGE PREVIEW MODAL */}
      {imagePreview && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-[#020617] p-4 rounded-xl w-[90%] max-w-md">
            <img
              src={imagePreview}
              alt="preview"
              className="rounded-lg max-h-[300px] mx-auto"
            />

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a caption..."
              className="w-full mt-3 bg-white/10 px-3 py-2 rounded"
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                  setText("");
                }}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>

              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-indigo-600 rounded"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div
        className={`w-full md:w-[300px] bg-[#020617]/90 p-4 flex flex-col
        ${currentChat ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex justify-between mb-4">
          <h1 className="text-xl font-bold">
            Campus<span className="text-indigo-400">Beats</span>
          </h1>
          <button onClick={toggleTheme}>🌗</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => openChat(u)}
              className="p-2 rounded hover:bg-white/10 cursor-pointer"
            >
              <p>{u.name}</p>
              <p className="text-xs text-gray-400">
                {onlineUsers.includes(u._id) ? "Online" : "Offline"}
              </p>
              {unread[u._id] > 0 && (
                <span className="text-xs bg-green-500 px-2 rounded">
                  {unread[u._id]}
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={logout}
          className="mt-4 bg-red-500 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* CHAT */}
      <div
        className={`flex-1 flex flex-col ${
          currentChat ? "flex" : "hidden md:flex"
        }`}
      >
        {currentChat && (
          <>
            <div className="p-3 border-b border-white/10 flex items-center gap-2">
              <button
                onClick={() => setCurrentChat(null)}
                className="md:hidden"
              >
                ←
              </button>
              <p>{currentChat.name}</p>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m) => {
                const isMe = m.senderId === user._id;
                return (
                  <div
                    key={m._id}
                    className={`flex ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] p-2 rounded-xl ${
                        isMe ? "bg-indigo-500" : "bg-white/10"
                      }`}
                    >
                      {m.text && <p>{m.text}</p>}
                      {m.image && (
                        <img
                          src={m.image}
                          alt="sent"
                          className="mt-2 rounded-lg max-h-60 cursor-pointer"
                          onClick={() =>
                            window.open(m.image, "_blank")
                          }
                        />
                      )}
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
              className="p-3 flex gap-2 border-t border-white/10 items-center"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="text-xl"
              >
                📎
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                hidden
              />

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm"
                placeholder="Type a message"
              />

              <button className="bg-indigo-600 px-4 py-2 rounded-full text-sm">
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
