import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    message: "API route is working",
    url: req.url,
    method: req.method,
    headers: {
      auth: req.headers.authorization ? "present" : "missing",
    },
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
