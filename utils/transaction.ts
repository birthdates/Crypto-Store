import {
  CoinpaymentsCreateTransactionResponse,
  CoinpaymentsGetTxResponse,
} from "coinpayments/dist/types/response";
import { client } from "./coinpayments";
import { del, get, redisClient } from "./redis";

/**
 * Data for cached currencies (saves requests)
 */
type CachedCurrency = {
  conversion: number;
  expiry: number;
};

/**
 * Our map of cached currencies (pair -> conversion multplier)
 */
const currencyCache: Map<String, CachedCurrency> = new Map();

/**
 * Redis transaction
 */
export type RedisSessionData = {
  id: string;
  status_url: string;
  image_url: string;
  amount: number;
  wallet: string;
  currency: string;
  completed: boolean;
};

/**
 * Transaction status
 */
export type TransactionStatus = {
  status: number;
  status_text: string;
  card?: string;
  received: number;
  amount: number;
};

/**
 * Transaction and it's status
 */
export type TransactionWithStatus = TransactionStatus & RedisSessionData;

/**
 * Get transaction status key from redis
 * @param session Session ID
 * @returns Transaction status key
 */
const getRedisKey = (session: string): string =>
  `crypto-transaction-${session}`;

/**
 * Get transaction from redis
 * @param txn_id Transaction ID
 * @returns Transaction data
 */
export const getTransactionRedisKey = (txn_id: string): string =>
  `crypto-transactions-${txn_id}`;

/**
 * Create transaction in Redis and Coinpayments
 * @param session Session ID
 * @param amount Amount
 * @param email Email
 * @param currency Currency
 * @returns Transaction
 */
export const createTransaction = async function (
  session: string,
  amount: number,
  email: string,
  currency: string
): Promise<RedisSessionData> {
  let transaction: CoinpaymentsCreateTransactionResponse;
  const curr = currency === "USDT" ? "USDT.TRC20" : currency;
  try {
    transaction = await client.createTransaction({
      amount,
      currency1: "USD",
      currency2: curr,
      buyer_email: email,
      item_name: `${amount} USD Store Credit`,
    });
  } catch (err: any) {
    throw err?.extra?.data?.error ?? "invalid_coin";
  }
  const data = {
    id: transaction.txn_id,
    image_url: transaction.qrcode_url,
    status_url: transaction.status_url,
    currency,
    amount,
    completed: false,
    wallet: transaction.address,
  };
  // Set session token -> transaction data in Redis and expire in 30 days
  redisClient.set(getRedisKey(session), JSON.stringify(data), "EX", 2592000);
  return data;
};

/**
 * Fetch transaction status from session token
 *
 * @param session Session token
 * @returns Transaction status
 */
export const fetchTransactionStatus = async (
  session: string
): Promise<null | { error: string } | TransactionWithStatus> => {
  if (!session) return null;
  let transaction: RedisSessionData;
  try {
    transaction = await getTransaction(session);
    if (!transaction) throw "Invalid transaction";
  } catch (err) {
    return { error: err as string };
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
    return { error: "Invalid transaction" };
  }
  return {
    id: transaction.id,
    currency: transaction.currency,
    wallet: transaction.wallet,
    ...status,
  } as any;
};

/**
 * Get transaction status from Coinpayments
 * @param txid Transaction ID
 * @returns Transaction status
 */
export const getTransactionStatus = async (
  txid: string
): Promise<CoinpaymentsGetTxResponse> => {
  return await client.getTx({ txid });
};

/**
 * Format status number to a message (coinpayments messages aren't very helpful)
 * @param status Status number
 * @returns Status message
 */
export const statusToMessage = (status: number): string => {
  switch (status) {
    case 1:
    case 0:
      return "Awaiting funds";
    case -2:
      return "Refunded";
    case -1:
      return "Expired";
    case 100:
    case 2:
      return "Received funds";
    case 5:
      return "Escrow received funds";
    case 3:
      return "Pending via PayPal";
  }
  return "Awaiting funds";
};

/**
 * Convert {@link ArrayBuffer} to {@link Buffer}
 * @param arrayBuffer ArrayBuffer
 * @returns Buffer
 */
const toBuffer = (arrayBuffer: ArrayBuffer): Buffer => {
  var buf = Buffer.alloc(arrayBuffer.byteLength);
  var view = new Uint8Array(arrayBuffer);
  for (var i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
};

/**
 * Get transaction image url and fetch it's bytes
 *
 * @param session Session token
 * @returns Transaction image bytes
 */
export const getTransactionImage = async function (
  session: string
): Promise<Buffer> {
  const sessionData = await getTransaction(session);
  const res = await fetch(sessionData.image_url);
  return toBuffer(await res.arrayBuffer());
};

/**
 * Get transaction from Redis
 * @param session Session token
 * @returns Transaction data
 */
export const getTransaction = async function (
  session: string
): Promise<RedisSessionData> {
  const rawSessionData = await get(getRedisKey(session));
  if (rawSessionData == null) throw "Forbidden";
  try {
    return JSON.parse(rawSessionData) as RedisSessionData;
  } catch (err) {
    throw "Invalid session data";
  }
};

/**
 * Cancel transaction and delete it from Redis
 * @param session Session token
 * @returns True, if transaction was cancelled. False, if transaction doesn't exist
 */
export const cancelTransaction = async function (
  session: string
): Promise<boolean> {
  const values = await Promise.all([
    del(getRedisKey(session)),
    del(getTransactionRedisKey(session)),
  ]);
  return values.find((v) => v) === true;
};

/**
 * Get the currency or LTC if LTCT
 */
const getCurrency = (currency: string): string =>
  currency === "LTCT" && process.env.NODE_ENV === "development"
    ? "LTC"
    : currency;

/**
 * Convert currency to another currency
 * @param amount Amount of USD
 * @param currency From currency
 * @param currency2 Target currency
 * @returns Amount in target currency
 */
export const convertCurrency = async (
  amount: number,
  currency: string,
  currency2?: string
): Promise<number> => {
  const curr = getCurrency(currency);
  const curr2 = currency2 ? getCurrency(currency2) : "USD";
  const id = curr + curr2;
  const cache = currencyCache.get(id);
  const now = Date.now();
  if (cache && cache.expiry > now) {
    return cache.conversion * amount;
  }
  const resp = await fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=${curr}&tsyms=${curr2}`
  );
  const data = await resp.json();
  if (data.Message || !data.USD) throw "Invalid currency";
  currencyCache.set(id, {
    conversion: data.USD,
    expiry: now + 1000 * 60 * 10, // Expire in 10 minutes
  });
  return data.USD * amount;
};
