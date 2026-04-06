/**
 * @param {...(string | false | null | undefined | string[])} values
 * @returns {string}
 */
export function cn(...values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(" ");
}
