import type { NextApiRequest, NextApiResponse } from "next";
import { Authentication } from "../../utils/authentication";
import { RateLimit } from "../../utils/ratelimit";
import { cancelTransaction } from "../../utils/transaction";

const rateLimit = RateLimit({
  expiry: 1800,
  max: 100,
  id: "cancel-transaction",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    res.redirect("/");
    return;
  }
  if (!(await rateLimit(req, res))) return;
  if (!Authentication(req, res)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  let success: boolean;
  try {
    success = await cancelTransaction(req.cookies.session);
  } catch (err) {
    res.status(400).json({ error: err });
    return;
  }
  res.status(200).json({ success });
}
