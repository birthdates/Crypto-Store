import Coinpayments from "coinpayments";
import crypto from "crypto";

const key = process.env.COIN_KEY as string;
const secret = process.env.COIN_SECRET as string;
const merchantID = process.env.COIN_MERCHANT_ID as string;
const ipnSecret = process.env.COIN_IPN_SECRET as string;

export let client: Coinpayments;

try {
  client = new Coinpayments({ key, secret });
} catch (err) {
  console.error(err);
}

/**
 * Check if the provided IPN HMAC is valid
 * @param body The body of the request
 * @param merchant The merchant ID from the POST body
 * @param HMAC The HMAC from the header
 * @returns True if the HMAC is valid, false otherwise
 */
export const isValidHMAC = (
  body: string,
  merchant: string,
  HMAC: string
): boolean => {
  if (merchant !== merchantID) return false;
  var hmac = crypto.createHmac("sha512", ipnSecret);
  hmac.update(body);
  return hmac.digest("hex") === HMAC;
};
