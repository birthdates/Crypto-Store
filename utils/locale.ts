const regex = /,/gi;

/**
 * Format the currency to 1 minimum decimal place, and max 8
 * @param {string} currency The currency to format
 * @returns {string} The formatted currency
 */
export const formatCurrency = (currency: number): string => {
  return currency
    .toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 8,
    })
    .replaceAll(regex, "");
};
