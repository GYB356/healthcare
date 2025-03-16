import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { authenticate, authorizeRoles, protect, authorize } from "../middleware/authMiddleware";
import { upload as multerUpload } from "../utils/upload";
import { io } from "../server";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Secure file upload (only for doctors & admins)
router.post("/", authenticate, authorizeRoles(["doctor", "admin"]), upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = `/uploads/${req.file.filename}`;
  
  // Emit event to notify patients & doctors
  io.emit("newReport", { message: "New medical report uploaded", filePath });

  res.json({ message: "File uploaded successfully", filePath });
});

// Generate signed URL for file access
router.get("/file/:filename", protect, (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  const token = jwt.sign({ filename: req.params.filename }, JWT_SECRET, { expiresIn: "1h" });
  const signedUrl = `${req.protocol}://${req.get("host")}/api/uploads/access/${token}`;

  res.json({ signedUrl });
});

// Access file using signed URL
router.get("/access/:token", (req, res) => {
  try {
    const { filename } = jwt.verify(req.params.token, JWT_SECRET);
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

// Get list of uploaded files (with role-based access)
router.get("/", authenticate, (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch files" });
    }
    
    // If admin or doctor, return all files
    if (req.user.role === "admin" || req.user.role === "doctor") {
      return res.json({ files });
    }
    
    // If patient, return only their files
    if (req.user.role === "patient" && req.user.files) {
      const userFiles = files.filter(file => req.user.files.includes(file));
      return res.json({ files: userFiles });
    }
    
    // Default: return empty array if no access
    res.json({ files: [] });
  });
});

// Secure file upload (only for doctors & admins)
router.post("/upload", protect, authorize("doctor", "admin"), multerUpload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "File upload failed" });
  }

  const filePath = `/uploads/${req.file.filename}`;
  
  // Emit event to notify patients & doctors
  io.emit("newReport", { message: "New medical report uploaded", filePath });

  res.json({ message: "File uploaded successfully", filePath });
});

export default router;