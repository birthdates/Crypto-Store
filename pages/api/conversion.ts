import type { NextApiRequest, NextApiResponse } from "next";
import { RateLimit } from "../../utils/ratelimit";
import { convertCurrency } from "../../utils/transaction";

const rateLimit = RateLimit({
  expiry: 600,
  max: 1000,
  id: "conversion",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(await rateLimit(req, res))) return;
  if (!req.query.currency) {
    res.status(404).json({ error: "Missing fields" });
    return;
  }
  let conversion: number;
  try {
    conversion = await convertCurrency(1, req.query.currency as string);
  } catch (err) {
    res.status(500).json({ error: err });
    return;
  }
  res.status(200).json({ conversion });
}
