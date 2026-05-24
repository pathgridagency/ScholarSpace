import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import marketplaceRoutes from "./routes/marketplace.js";
import studyRoomRoutes from "./routes/studyrooms.js";
import userRoutes from "./routes/users.js";
import universityRoutes from "./routes/universities.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "scholarspace-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/studyrooms", studyRoomRoutes);
app.use("/api/universities", universityRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
