import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import Message from "./models/Message.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(console.log);

const onlineUsers = new Set();

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /* ---------- ONLINE ---------- */
    socket.on("user_online", async (userId) => {
        socket.userId = userId;
        onlineUsers.add(userId);

        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("online_users", Array.from(onlineUsers));
    });

    /* ---------- JOIN ROOM ---------- */
    socket.on("join_private", ({ room }) => {
        socket.join(room);
    });

    /* ---------- MESSAGE ---------- */
    socket.on("private_message", async (data) => {
        const saved = await Message.create({
            room: data.room,
            senderId: data.senderId,
            receiverId: data.receiverId,
            text: data.text || "",
            image: data.image || null,
            delivered: true,
            seen: false,
        });

        io.to(data.room).emit("receive_private", saved);
    });

    /* ---------- SEEN ---------- */
    socket.on("seen_message", async ({ room, userId }) => {
        await Message.updateMany(
            { room, receiverId: userId, seen: false },
            { seen: true }
        );
        io.to(room).emit("seen", userId);
    });

    /* ---------- TYPING INDICATOR ---------- */
    socket.on("typing", ({ room, userId }) => {
        socket.to(room).emit("typing", { userId });
    });

    socket.on("stop_typing", ({ room, userId }) => {
        socket.to(room).emit("stop_typing", { userId });
    });

    /* ---------- DISCONNECT ---------- */
    socket.on("disconnect", async () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastSeen: new Date(),
            });
            io.emit("online_users", Array.from(onlineUsers));
        }
    });
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
