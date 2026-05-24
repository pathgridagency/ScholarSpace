import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", async (req, res) => {
  const { name, description } = req.body;
  const { userId } = req.user;

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      createdById: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: true,
    },
  });

  res.status(201).json(project);
});

router.get("/", async (req, res) => {
  const { userId } = req.user;

  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(projects);
});

router.get("/:id", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });

  if (!membership) {
    return res.status(403).json({ error: "Not a member of this project" });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  res.json(project);
});

router.patch("/:id", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ error: "Only the project owner can update" });
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
    },
  });

  res.json(project);
});

router.get("/:id/tasks", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });

  if (!membership) {
    return res.status(403).json({ error: "Not a member of this project" });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const board = {
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
  };

  for (const task of tasks) {
    board[task.status].push(task);
  }

  res.json(board);
});

router.post("/:id/tasks", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { title, description, assignedToId, dueDate } = req.body;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });

  if (!membership || membership.role === "VIEWER") {
    return res.status(403).json({ error: "Viewers cannot create tasks" });
  }

  if (!title) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const task = await prisma.task.create({
    data: {
      projectId: id,
      title,
      description,
      assignedToId: assignedToId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.status(201).json(task);
});

router.patch("/:projectId/tasks/:taskId", async (req, res) => {
  const { userId } = req.user;
  const { projectId, taskId } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  if (!membership || membership.role === "VIEWER") {
    return res.status(403).json({ error: "Viewers cannot update tasks" });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      assignedToId: req.body.assignedToId,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ error: "Only the owner can delete the project" });
  }

  await prisma.project.delete({ where: { id } });
  res.status(204).end();
});

router.delete("/:projectId/tasks/:taskId", async (req, res) => {
  const { userId } = req.user;
  const { projectId, taskId } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  if (!membership || membership.role === "VIEWER") {
    return res.status(403).json({ error: "Viewers cannot delete tasks" });
  }

  await prisma.task.delete({ where: { id: taskId } });
  res.status(204).end();
});

router.post("/:id/members", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { targetUserId, role } = req.body;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ error: "Only the owner can add members" });
  }

  const member = await prisma.projectMember.create({
    data: { userId: targetUserId, projectId: id, role: role || "EDITOR" },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  res.status(201).json(member);
});

router.delete("/:id/members/:targetUserId", async (req, res) => {
  const { userId } = req.user;
  const { id, targetUserId } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ error: "Only the owner can remove members" });
  }

  if (userId === targetUserId) {
    return res.status(400).json({ error: "Cannot remove yourself" });
  }

  await prisma.projectMember.delete({
    where: { userId_projectId: { userId: targetUserId, projectId: id } },
  });

  res.status(204).end();
});

export default router;
