import express from "express";
import multer from "multer";
import {
  uploadFile,
  uploadFiles,
  getFile,
  deleteFile,
} from "../controllers/ticket-screenshots.controllers.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Single upload
router.post("/upload/:bucket/:type", upload.single("file"), uploadFile);

// Multiple upload
router.post("/upload-multiple/:bucket/:type", upload.array("files", 30), uploadFiles);

// Get file
router.get("/files/:bucket/:folder/:filename", getFile);

// Delete file
router.delete("/files/:bucket/:folder/:filename", deleteFile);

// Multiple Delete
router.delete("/files/delete-multiple", deleteFiles);

export default router;
