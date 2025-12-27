import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// get messages of a room
router.get("/:room", async (req, res) => {
    const room = req.params.room;
    const msgs = await Message.find({ room }).sort({ createdAt: 1 });
    res.json(msgs);
});

// sidebar summary
router.get("/summary/:room", async (req, res) => {
    const room = req.params.room;

    const lastMessage = await Message.findOne({ room }).sort({
        createdAt: -1,
    });

    const unreadCount = await Message.countDocuments({
        room,
        seen: false,
    });

    res.json({ lastMessage, unreadCount });
});

export default router;
