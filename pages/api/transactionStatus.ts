import type { NextApiRequest, NextApiResponse } from "next";
import { Authentication } from "../../utils/authentication";
import { RateLimit } from "../../utils/ratelimit";
import { fetchTransactionStatus } from "../../utils/transaction";

const rateLimit = RateLimit({
  expiry: 300,
  max: 10000,
  id: "transaction-status",
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

  let data: any = await fetchTransactionStatus(req.cookies.session);
  if (!data || data.error) {
    res.status(400).json({ error: data ? data.error : "Unknown error" });
    return;
  }

  res.status(200).json(data);
}
