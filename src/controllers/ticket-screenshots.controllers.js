import multer from "multer";
import { Client } from "minio";
import dotenv from "dotenv";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

// MinIO Client
const minioClient = new Client({
  endPoint: process.env.ENDPOINT,
  useSSL: true,
  accessKey: process.env.ACCESS_KEY,
  secretKey: process.env.SECRET_KEY,
});

// Bucket Name
const bucketName = process.env.BUCKET_NAME;

// Helper to map type → folder
function getFolder(type) {
  switch (type) {
    case "avatar":
      return "avatars";
    case "screenshot":
      return "tickets";
    case "post":
      return "posts";
    default:
      return "misc";
  }
}

// ✅ Upload file
export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const { type } = req.params;

    // If no File is uploaded
    if (!file) {
      console.error("❌ No file received");
      return res.status(400).send("No file uploaded");
    }

    // console.log("📥 Uploading file:", file.originalname, "->", type);

    const metaData = { "Content-Type": file.mimetype };

    // Unique filename generation Date and Time
    const now = new Date();

    // Helper to pad numbers (e.g. 8 → 08)
    const pad = (n) => n.toString().padStart(2, "0");

    // Local time formatted filename
    const dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(
      now.getSeconds()
    )}`;

    const uniqueFileName = `${dateTime}-${file.originalname}`;

    // Upload to MinIO
    await minioClient.putObject(
      bucketName,
      `${type}/${uniqueFileName}`,
      file.buffer,
      file.size,
      metaData
    );

    // JSON response with file details
    res.json({
      message: "✅ File uploaded successfully",
      filename: file.originalname,
      url: `https://s3.acemcbohol.dev/${bucketName}/${type}/${uniqueFileName}`,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

export const uploadFiles = async (req, res) => {
  try {
    const files = req.files; // multer gives an array here
    const { type } = req.params;

    if (!files || files.length === 0) {
      console.error("❌ No files received");
      return res.status(400).send("No files uploaded");
    }

    const uploadedFiles = [];

    for (const file of files) {
      const metaData = { "Content-Type": file.mimetype };

      // Unique filename generation
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(
        now.getSeconds()
      )}`;

      const uniqueFileName = `${dateTime}-${file.originalname}`;

      // Upload each file to MinIO
      await minioClient.putObject(
        bucketName,
        `${type}/${uniqueFileName}`,
        file.buffer,
        file.size,
        metaData
      );

      uploadedFiles.push({
        filename: file.originalname,
        url: `https://s3.acemcbohol.dev/${bucketName}/${type}/${uniqueFileName}`,
      });
    }

    res.json({
      message: "✅ Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

// ✅ Get file
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
