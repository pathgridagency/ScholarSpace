import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const { userId, email } = req.user;

  let user = await prisma.user.findUnique({
    where: { email },
    include: { university: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { id: userId, email, firstName: email.split("@")[0] || "Student", lastName: "", universityId: null },
      include: { university: true },
    });
  }

  const stats = await Promise.all([
    prisma.project.count({ where: { members: { some: { userId } } } }),
    prisma.marketplaceListing.count({ where: { sellerId: userId } }),
    prisma.studyRoom.count({ where: { hostId: userId, isActive: true } }),
    prisma.task.count({ where: { assignedToId: userId, status: { not: "DONE" } } }),
  ]);

  res.json({
    ...user,
    stats: { projects: stats[0], listings: stats[1], activeRooms: stats[2], pendingTasks: stats[3] },
  });
});

router.patch("/me", async (req, res) => {
  const { email } = req.user;
  const { firstName, lastName, major, gradYear, universityId } = req.body;

  const user = await prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, major, gradYear, universityId: universityId || null },
    create: {
      id: req.user.userId,
      email,
      firstName: firstName || email.split("@")[0],
      lastName: lastName || "",
      universityId: universityId || null,
      major,
      gradYear,
    },
    include: { university: true },
  });

  res.json(user);
});

router.get("/search", async (req, res) => {
  const { q } = req.query;
  const { email } = req.user;
  const domain = email.split("@")[1];

  if (!q || typeof q !== "string" || q.length < 2) {
    return res.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      email: { endsWith: `@${domain}`, contains: q, mode: "insensitive" },
      NOT: { email },
    },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 10,
  });

  res.json(users);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { university: true },
    select: {
      id: true, firstName: true, lastName: true, major: true, gradYear: true,
      university: true, email: true,
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  const stats = await Promise.all([
    prisma.project.count({ where: { members: { some: { userId: id } } } }),
    prisma.marketplaceListing.count({ where: { sellerId: id } }),
  ]);

  res.json({ ...user, stats: { projects: stats[0], listings: stats[1] } });
});

export default router;
