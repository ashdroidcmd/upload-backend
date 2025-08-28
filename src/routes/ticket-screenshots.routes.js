import express from "express";
import multer from "multer";
import {
  uploadFile,
  getFile,
  uploadFiles,
} from "../controllers/ticket-screenshots.controllers.js";

// Setup multer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Upload route (POST + multer middleware)
router.post("/upload/:type", upload.single("file"), uploadFile); 

// Multiple files (posts with many images)
router.post("/upload-multiple/:type", upload.array("files", 15), uploadFiles);

// Get route (GET by filename)
router.get("/files/:bucket/:folder/:filename", getFile);

// Delete by File

export default router;
