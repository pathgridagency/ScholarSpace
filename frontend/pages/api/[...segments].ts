import type { NextApiRequest, NextApiResponse } from "next";
import app from "../../lib/api-server/app";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
