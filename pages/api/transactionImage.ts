import type { NextApiRequest, NextApiResponse } from "next";
import { Authentication } from "../../utils/authentication";
import { RateLimit } from "../../utils/ratelimit";
import { getTransactionImage } from "../../utils/transaction";

const rateLimit = RateLimit({
  expiry: 3600,
  max: 1000,
  id: "transaction-image",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(await rateLimit(req, res))) return;
  if (!Authentication(req, res)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  let imageData: Buffer;
  try {
    imageData = await getTransactionImage(req.cookies.session);
  } catch (err) {
    res.status(400).json({ error: err });
    return;
  }
  res.setHeader("Content-Type", "image/png");
  res.status(200).send(imageData);
}
