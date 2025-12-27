import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        room: String,

        senderId: String,
        receiverId: String,
        senderName: String,

        text: String,
        mediaType: String,

        delivered: { type: Boolean, default: false },
        seen: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
