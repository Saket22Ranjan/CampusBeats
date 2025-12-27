import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// College email check
const isCollegeEmail = (email) => {
    return email.endsWith(".edu") || email.includes("college");
};

// REGISTER
router.post("/register", async (req, res) => {
    const { name, email, password, college } = req.body;

    if (!isCollegeEmail(email)) {
        return res.status(400).json({ message: "Use college email only" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        college,
        verified: true
    });

    res.status(201).json({ message: "Registered successfully" });
});

// LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.json({ token, user });
});

export default router;
