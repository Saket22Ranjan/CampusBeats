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

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

/* ================= MONGO ================= */
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

/* ================= SOCKET.IO ================= */
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // join private room
    socket.on("join_private", ({ room }) => {
        socket.join(room);
    });

    // send message
    socket.on("private_message", async (data) => {
        const msg = await Message.create({
            room: data.room,
            senderId: data.senderId,
            receiverId: data.receiverId,
            senderName: data.senderName,
            text: data.message,
            mediaType: data.mediaType,
            delivered: true,
            seen: false,
        });

        io.to(data.room).emit("receive_private", msg);
    });

    // seen message (ONLY receiver)
    socket.on("seen_message", async ({ room, userId }) => {
        await Message.updateMany(
            {
                room,
                receiverId: userId,
                seen: false,
            },
            { seen: true }
        );

        socket.to(room).emit("seen", userId);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
