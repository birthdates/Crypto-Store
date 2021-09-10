const tebexSecret = process.env.TEBEX_SECRET as string;
const craftingStoreSecret = process.env.CRAFTING_STORE_SECRET as string;

/**
 * Generates a gift card for the given balance.
 * @param balance The balance of the gift card.
 * @returns The card number.
 */
export const generateGiftcard = (balance: string): Promise<string> => {
  return tebexSecret
    ? generateBuycraftGiftcard(balance)
    : generateCraftingStoreGiftcard(balance);
};

/**
 * Generates a gift card for the given balance on Tebex.
 * @param balance The balance of the gift card.
 * @returns The card number.
 */
const generateBuycraftGiftcard = async (balance: string): Promise<string> => {
  const res = await fetch("https://plugin.tebex.io/gift-cards", {
    method: "POST",
    headers: {
      "X-Tebex-Secret": tebexSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: balance, note: "Crypto Transfer" }),
  });
  const data = (await res.json()).data;
  return data.code;
};

/**
 * Generates a gift card for the given balance on Crafting Store.
 * @param balance The balance of the gift card.
 * @returns The card number.
 */
const generateCraftingStoreGiftcard = async (
  balance: string
): Promise<string> => {
  const res = await fetch("https://api.craftingstore.net/v7/gift-cards", {
    method: "POST",
    headers: {
      token: craftingStoreSecret,
    },
    body: JSON.stringify({ amount: balance }),
  });
  const data = (await res.json()).data;
  return data.code;
};
