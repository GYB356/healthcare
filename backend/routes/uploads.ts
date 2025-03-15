import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = express.Router();

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
  res.json({ message: "File uploaded", filename: req.file.filename });
});

// Secure file retrieval
router.get("/:filename", authenticate, async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Allow only admin, doctors, or the patient to access the file
  if (req.user.role === "admin" || req.user.role === "doctor" || 
      (req.user.files && req.user.files.includes(filename))) {
    return res.sendFile(filePath);
  }

  res.status(403).json({ message: "Access denied" });
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

export default router; 