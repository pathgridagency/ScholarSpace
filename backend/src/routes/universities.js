import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
  });
  res.json(universities);
});

export default router;
