import type { NextApiRequest, NextApiResponse } from "next";
import { Authentication } from "../../utils/authentication";
import { RateLimit } from "../../utils/ratelimit";
import {
  createTransaction,
  getTransaction,
  RedisSessionData,
} from "../../utils/transaction";

const rateLimit = RateLimit({
  expiry: 1800,
  max: 50,
  id: "create-transaction",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(await rateLimit(req, res))) return;
  if (!req.body.amount || !req.body.currency || req.body.amount <= 0) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  let transaction: RedisSessionData = undefined!;
  if (Authentication(req, res)) {
    try {
      transaction = await getTransaction(req.cookies.session);
    } catch (err) {}
  }
  try {
    transaction =
      transaction ||
      (await createTransaction(
        req.cookies.session,
        req.body.amount,
        req.body.email,
        req.body.currency
      ));
  } catch (err) {
    res.status(400).json({ error: err });
    return;
  }

  res.status(200).json({
    success: true,
    ...transaction,
  });
}
