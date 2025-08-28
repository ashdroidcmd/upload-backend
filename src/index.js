import express from "express";
import cors from "cors";
import uploadImages from "./routes/ticket-screenshots.routes.js";

const app = express();

const allowedOrigins = ["http://localhost:4173", "*"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use("/", uploadImages);

export default app;
