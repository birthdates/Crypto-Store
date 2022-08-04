import type { NextApiRequest, NextApiResponse } from "next";
import { generateGiftcard } from "../../utils/giftcard";
import { isValidHMAC } from "../../utils/coinpayments";
import { RateLimit } from "../../utils/ratelimit";
import { get, redisClient } from "../../utils/redis";
import {
  convertCurrency,
  getTransactionRedisKey,
  statusToMessage,
} from "../../utils/transaction";

export const config = {
  api: {
    bodyParser: false,
  },
};

const rateLimit = RateLimit({
  expiry: 300,
  max: 10000,
  id: "validate-status",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.redirect("/");
    return;
  }
  if (!(await rateLimit(req, res))) return;

  let buffer = "";
  req.on("data", (chunk) => {
    buffer += chunk;
  });
  req.on("end", async () => {
    const HMAC: string = req.headers.hmac as string;
    const merchant = (buffer.match(/(?<=merchant=).+?(?=&|\/)/g) || [])[0];
    const txn_id = (buffer.match(/(?<=txn_id=).*/g) || [])[0];
    const status = (buffer.match(/(?<=status=).+?(?=&|\/)/g) || [])[0];
    const status_text = statusToMessage(parseInt(status));
    const amount = (buffer.match(/(?<=amount2=).+?(?=&|\/)/g) || [])[0];
    const received_amount = (buffer.match(
      /(?<=received_amount=).+?(?=&|\/)/g
    ) || [])[0];
    const currency = (buffer.match(/(?<=currency2=).+?(?=&|\/)/g) || [])[0];

    // If HMAC is invalid, return
    if (!HMAC || !isValidHMAC(buffer, merchant, HMAC)) {
      console.log("Invalid HMAC", buffer, merchant, HMAC);
      res.status(400).json({});
      return;
    }

    // Generate giftcard if applicable
    const cardObj =
      status === "2" || status === "100"
        ? {
            card: await generateGiftcard(
              (await convertCurrency(amount as any, "USD", currency)).toString()
            ),
          }
        : undefined;

    // Update status
    const key = getTransactionRedisKey(txn_id);

    redisClient.set(
      key,
      JSON.stringify({
        status: parseInt(status),
        status_text,
        received: parseFloat(received_amount),
        amount: parseFloat(amount),
        ...cardObj,
      })
    );
    res.status(200).json({});
  });
}
