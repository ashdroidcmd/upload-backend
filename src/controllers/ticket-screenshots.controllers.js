import multer from "multer";
import { Client } from "minio";
import dotenv from "dotenv";
import sharp from "sharp"; // image processing library to webp

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

// MinIO Client
const minioClient = new Client({
  endPoint: process.env.ENDPOINT,
  useSSL: true,
  accessKey: process.env.ACCESS_KEY,
  secretKey: process.env.SECRET_KEY,
});

// Helper: Unique Filename Generator
function generateUniqueFileName(originalName) {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  return `${dateTime}-${originalName.split(".")[0]}.webp`;
}

// Upload Single File
export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const { bucket, type } = req.params;

    if (!file) {
      return res.status(400).send("No file uploaded");
    }

    let buffer;
    let uniqueFileName;
    let contentType;

    if (file.mimetype.startsWith("image/")) {
      // Convert images to WebP
      buffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
      uniqueFileName = generateUniqueFileName(file.originalname);
      contentType = "image/webp";
    } else {
      // Keep other files (PDF, DOCX, etc.) as-is
      buffer = file.buffer;
      uniqueFileName = `${Date.now()}-${file.originalname}`;
      contentType = file.mimetype; // keep correct mimetype
    }

    // Upload to MinIO
    await minioClient.putObject(
      bucket,
      `${type}/${uniqueFileName}`,
      buffer,
      buffer.length,
      { "Content-Type": contentType }
    );

    res.json({
      message: "✅ File uploaded successfully",
      bucket,
      original: file.originalname,
      storedAs: uniqueFileName,
      type: file.mimetype,
      url: `https://${process.env.ENDPOINT}/${bucket}/${type}/${uniqueFileName}`,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

// Upload Multiple Files
export const uploadFiles = async (req, res) => {
  try {
    const files = req.files;
    const { bucket, type } = req.params;

    if (!files || files.length === 0) {
      return res.status(400).send("No files uploaded");
    }

    const uploadedFiles = [];

    for (const file of files) {
      let buffer;
      let uniqueFileName;
      let contentType;

      if (file.mimetype.startsWith("image/")) {
        buffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
        uniqueFileName = generateUniqueFileName(file.originalname);
        contentType = "image/webp";
      } else {
        buffer = file.buffer;
        uniqueFileName = `${Date.now()}-${file.originalname}`;
        contentType = file.mimetype;
      }

      await minioClient.putObject(
        bucket,
        `${type}/${uniqueFileName}`,
        buffer,
        buffer.length,
        { "Content-Type": contentType }
      );

      uploadedFiles.push({
        original: file.originalname,
        storedAs: uniqueFileName,
        type: file.mimetype,
        url: `https://${process.env.ENDPOINT}/${bucket}/${type}/${uniqueFileName}`,
      });
    }

    res.json({
      message: "✅ Files uploaded successfully",
      bucket,
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

//  Get File
export const getFile = async (req, res) => {
  const { bucket, folder, filename } = req.params;

  if (!bucket || !folder || !filename) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const objectName = `${folder}/${filename}`;

  minioClient.getObject(bucket, objectName, (err, dataStream) => {
    if (err) {
      console.error("MinIO error:", err);
      return res.status(500).json({ error: err.message });
    }

    // Stream file to response
    dataStream.pipe(res);

    dataStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).json({ error: "Error streaming file" });
    });
  });
};

// Delete File
export const deleteFile = async (req, res) => {
  try {
    const { bucket, folder, filename } = req.params;

    if (!bucket || !folder || !filename) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const objectName = `${folder}/${filename}`;

    await minioClient.removeObject(bucket, objectName);

    res.json({
      message: "🗑️ File deleted successfully",
      bucket,
      object: objectName,
    });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
};

// Delete multiple files
export const deleteFiles = async (req, res) => {
  try {
    const { bucket, folder, filenames } = req.body;

    if (!bucket || !folder || !filenames || !Array.isArray(filenames)) {
      return res
        .status(400)
        .json({ error: "bucket, folder, and filenames[] are required" });
    }

    const results = [];

    for (const filename of filenames) {
      const objectName = `${folder}/${filename}`;
      try {
        await minioClient.removeObject(bucket, objectName);
        results.push({ filename, status: "deleted" });
      } catch (err) {
        console.error("❌ Error deleting:", filename, err.message);
        results.push({ filename, status: "error", error: err.message });
      }
    }

    res.json({
      message: "🗑️ Delete operation completed",
      results,
    });
  } catch (err) {
    console.error("❌ Delete multiple error:", err);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
};
