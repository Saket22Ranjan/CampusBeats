import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useRef, useState } from "react";
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
  const [typingUser, setTypingUser] = useState(null);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /* ================= INIT ================= */
  useEffect(() => {
    axios.get("http://localhost:5000/api/users").then((res) => {
      setUsers(res.data.filter((u) => u._id !== user._id));
    });

    socket.emit("user_online", user._id);

    socket.on("online_users", setOnlineUsers);

    socket.on("receive_private", (msg) => {
      // ✅ ignore own message (already added optimistically)
      if (String(msg.senderId) === String(user._id)) return;

      setMessages((prev) => [...prev, msg]);
      socket.emit("seen_message", { room: msg.room, userId: user._id });
    });

    socket.on("seen", () => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.senderId) === String(user._id)
            ? { ...m, seen: true }
            : m
        )
      );
    });

    socket.on("typing", ({ userId }) => {
      if (currentChat && String(userId) === String(currentChat._id)) {
        setTypingUser(userId);
      }
    });

    socket.on("stop_typing", () => setTypingUser(null));

    return () => {
      socket.off("online_users");
      socket.off("receive_private");
      socket.off("seen");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [user._id, currentChat]);

  /* ================= AUTOSCROLL ================= */
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
  };

  /* ================= IMAGE ================= */
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
        formData
      );
      imageUrl = uploadRes.data.imageUrl;
    }

    const msgData = {
      _id: Date.now(), // temp id
      room: currentRoom,
      senderId: user._id,
      receiverId: currentChat._id,
      text: text || "",
      image: imageUrl || null,
      createdAt: new Date(),
      seen: false,
    };

    // ✅ optimistic add (ONLY PLACE sender message is added)
    setMessages((prev) => [...prev, msgData]);

    socket.emit("private_message", msgData);

    setText("");
    setImage(null);
    setImagePreview(null);
  };

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* SIDEBAR */}
      <div className="w-72 p-4 border-r border-white/10">
        <h1 className="text-xl font-bold mb-4">
          Campus<span className="text-indigo-400">Beats</span>
        </h1>

        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => openChat(u)}
            className="p-2 hover:bg-white/10 cursor-pointer rounded"
          >
            {u.name}
            <span className="text-xs ml-2">
              {onlineUsers.includes(u._id) ? "🟢" : "⚪"}
            </span>
          </div>
        ))}

        <button
          onClick={logout}
          className="mt-4 bg-red-500 w-full py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col">
        {currentChat && (
          <>
            <div className="p-3 border-b border-white/10">
              <p className="font-semibold">{currentChat.name}</p>
              {typingUser && (
                <p className="text-xs text-green-400">typing...</p>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((m) => {
                const isMe =
                  String(m.senderId) === String(user._id);
                return (
                  <div
                    key={m._id}
                    className={`mb-2 ${isMe ? "text-right" : "text-left"
                      }`}
                  >
                    <div
                      className={`inline-block px-3 py-2 rounded ${isMe ? "bg-indigo-600" : "bg-gray-700"
                        }`}
                    >
                      {m.text}
                      {m.image && (
                        <img
                          src={m.image}
                          alt=""
                          className="mt-2 max-h-40 rounded"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="p-3 flex gap-2 border-t border-white/10"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
              >
                📎
              </button>

              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleImageSelect}
              />

              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);

                  socket.emit("typing", {
                    room: currentRoom,
                    userId: user._id,
                  });

                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    socket.emit("stop_typing", {
                      room: currentRoom,
                      userId: user._id,
                    });
                  }, 700);
                }}
                className="flex-1 bg-white/10 rounded px-3"
                placeholder="Type..."
              />

              <button className="bg-indigo-600 px-4 rounded">
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
