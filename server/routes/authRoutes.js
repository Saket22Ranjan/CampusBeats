import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

/* REGISTER */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ msg: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            isProfileComplete: false,
        });

        res.status(201).json({ msg: "User created successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Registration failed" });
    }
});

/* LOGIN */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // 🔥 SEND USER WITHOUT PASSWORD
        const { password: _, ...safeUser } = user._doc;
        res.json(safeUser);
    } catch (err) {
        res.status(500).json({ msg: "Login failed" });
    }
});

export default router;
