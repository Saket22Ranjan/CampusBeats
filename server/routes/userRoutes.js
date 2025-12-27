import express from "express";
import User from "../models/User.js";

const router = express.Router();

// get all users
router.get("/", async (req, res) => {
    const users = await User.find().select("-password");
    res.json(users);
});

// update profile
router.put("/:id", async (req, res) => {
    const { name, college } = req.body;
    await User.findByIdAndUpdate(req.params.id, { name, college });
    res.json({ message: "Profile updated" });
});

export default router;
