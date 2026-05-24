import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const rooms = await prisma.studyRoom.findMany({
    where: { isActive: true },
    include: {
      host: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  res.json(rooms);
});

router.post("/", async (req, res) => {
  const { userId } = req.user;
  const { topic, mode } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const room = await prisma.studyRoom.create({
    data: { hostId: userId, topic },
    include: {
      host: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.status(201).json({ ...room, mode: mode || "SILENT_ACCOUNTABILITY" });
});

router.patch("/:id/end", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const room = await prisma.studyRoom.findUnique({ where: { id } });

  if (!room) {
    return res.status(404).json({ error: "Study room not found" });
  }

  if (room.hostId !== userId) {
    return res.status(403).json({ error: "Only the host can end the study room" });
  }

  const updated = await prisma.studyRoom.update({
    where: { id },
    data: { isActive: false },
  });

  res.json(updated);
});

router.put("/:id/close", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const room = await prisma.studyRoom.findUnique({ where: { id } });

  if (!room) {
    return res.status(404).json({ error: "Study room not found" });
  }

  if (room.hostId !== userId) {
    return res.status(403).json({ error: "Only the host can close the study room" });
  }

  const updated = await prisma.studyRoom.update({
    where: { id },
    data: { isActive: false },
  });

  res.json(updated);
});

export default router;
