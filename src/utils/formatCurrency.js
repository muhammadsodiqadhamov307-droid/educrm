/**
 * @param {number | string | null | undefined} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const numericAmount = Number(amount || 0);
  const [whole, decimals] = numericAmount.toFixed(2).split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decimals === "00"
    ? `${formattedWhole} so'm`
    : `${formattedWhole}.${decimals} so'm`;
}
