import type { NextApiRequest, NextApiResponse } from "next";
import { Authentication } from "../../utils/authentication";
import { RateLimit } from "../../utils/ratelimit";
import { get } from "../../utils/redis";
import {
  getTransaction,
  getTransactionRedisKey,
  getTransactionStatus,
  RedisSessionData,
  statusToMessage,
  TransactionStatus,
} from "../../utils/transaction";

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

  let transaction: RedisSessionData;
  try {
    transaction = await getTransaction(req.cookies.session);
    if (!transaction) throw "Invalid transaction";
  } catch (err) {
    res.status(403).json({ error: err });
    return;
  }

  const rawTransactionStatus = await get(
    getTransactionRedisKey(transaction.id)
  );
  let status: TransactionStatus;
  try {
    status = JSON.parse(rawTransactionStatus) as TransactionStatus;
    if (status === null) {
      const webStatus = await getTransactionStatus(transaction.id);
      status = {
        amount: parseFloat(webStatus.amountf),
        received: parseFloat(webStatus.receivedf),
        status: webStatus.status,
        status_text: statusToMessage(webStatus.status),
      };
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid transaction" });
    return;
  }
  res.status(200).json({
    id: transaction.id,
    currency: transaction.currency,
    wallet: transaction.wallet,
    ...status,
  });
}
