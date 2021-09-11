import Coinpayments from "coinpayments";
import crypto from "crypto";

const key = "4c3719dd02ff54d7bf1b459adbf83c366fae99827c14de23ef55c29a6e0f56b9"; //process.env.COIN_KEY as string;
const secret =
  "2Dd6c6c5D962e97ADBB53c4Dc0dA7fd09feDd4edB9E0f5D64af8C1202e693509"; //process.env.COIN_SECRET as string;
const merchantID = "29f4ed3d1e43269d0efab1475cf9c08d"; //process.env.COIN_MERCHANT_ID as string;
const ipnSecret = ")[>uynDpj76RrBC."; //process.env.COIN_IPN_SECRET as string;

export const client = new Coinpayments({ key, secret });

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
