import express from "express";
import User from "../models/User.js";

const router = express.Router();

/* GET ALL USERS */
router.get("/", async (req, res) => {
    const users = await User.find({}, "-password");
    res.json(users);
});

/* UPDATE PROFILE (COLLEGE DETAILS) */
router.put("/:id", async (req, res) => {
    const { name, college, course, branch, year, phone } = req.body;

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name,
            college,
            course,
            branch,
            year,
            phone,
            isProfileComplete: true,
        },
        { new: true }
    );

    res.json(user);
});

export default router;
