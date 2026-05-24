import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const mod = await import("../../lib/api-server/app");
    return mod.default(req, res);
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    res.status(500).json({ error: msg });
  }
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
