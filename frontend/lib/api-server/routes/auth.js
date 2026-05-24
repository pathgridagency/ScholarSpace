import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, major, gradYear } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || !domain.endsWith(".edu")) {
    return res.status(400).json({ error: "Email must be a valid .edu address" });
  }

  const university = await prisma.university.findUnique({ where: { domain } });
  if (!university) {
    return res.status(400).json({
      error: `No registered university found for domain "${domain}". Contact your university admin.`,
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "A user with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      major,
      gradYear: gradYear ? parseInt(gradYear, 10) : null,
      universityId: university.id,
    },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, universityId: user.universityId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      university: university.name,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { university: true },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, universityId: user.universityId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      university: user.university.name,
    },
  });
});

export default router;
