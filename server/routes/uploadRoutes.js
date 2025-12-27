import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

// storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// upload endpoint
router.post("/", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const isImage = req.file.mimetype.startsWith("image");

    res.json({
        url: `http://localhost:5000/uploads/${req.file.filename}`,
        type: isImage ? "image" : "file",
    });
});

export default router;
