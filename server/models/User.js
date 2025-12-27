import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },

        // 🔥 College profile
        college: { type: String },
        course: { type: String },
        branch: { type: String },
        year: { type: String },
        phone: { type: String },

        isProfileComplete: {
            type: Boolean,
            default: false,
        },

        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
