import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { email } = req.user;
  const { type, status } = req.query;

  const domain = email.split("@")[1]?.toLowerCase();

  const where = {
    status: status || "AVAILABLE",
    seller: { email: { endsWith: `@${domain}` } },
  };

  if (type) {
    where.type = type;
  }

  const listings = await prisma.marketplaceListing.findMany({
    where,
    include: {
      seller: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(listings);
});

router.get("/:id", async (req, res) => {
  const { email } = req.user;
  const { id } = req.params;
  const domain = email.split("@")[1]?.toLowerCase();

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: {
      seller: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  const listingDomain = listing.seller.email.split("@")[1]?.toLowerCase();
  if (listingDomain !== domain) {
    return res.status(403).json({ error: "This listing is from a different university" });
  }

  const { email: _, ...seller } = listing.seller;
  res.json({ ...listing, seller });
});

router.post("/", async (req, res) => {
  const { userId } = req.user;
  const { type, title, isbn, price } = req.body;

  if (!type || !title || price === undefined) {
    return res.status(400).json({ error: "type, title, and price are required" });
  }

  const validTypes = ["TEXTBOOK", "NOTES", "STUDY_GUIDE"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
  }

  const listing = await prisma.marketplaceListing.create({
    data: { sellerId: userId, type, title, isbn, price },
    include: {
      seller: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.status(201).json(listing);
});

router.patch("/:id/status", async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { status } = req.body;

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });

  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.sellerId !== userId) return res.status(403).json({ error: "Only the seller can update listing status" });

  const validStatuses = ["AVAILABLE", "PENDING", "SOLD"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
  }

  const updated = await prisma.marketplaceListing.update({
    where: { id },
    data: { status },
    include: { seller: { select: { id: true, firstName: true, lastName: true } } },
  });

  res.json(updated);
});

export default router;
