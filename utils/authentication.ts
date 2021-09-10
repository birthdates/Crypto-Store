import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

/**
 * Generates a random string of characters
 * @returns {string} Random string of characters
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(128).toString("base64");
};

/**
 * Generate a JWT token
 * @param req The request object
 * @param res The response object
 * @returns The JWT token
 */
export const Authentication = (
  req: NextApiRequest,
  res: NextApiResponse
): boolean => {
  if (!!req.cookies.session) return true;
  res.setHeader("set-cookie", `session=${generateRandomToken()}; Path=/;`);
  return false;
};
