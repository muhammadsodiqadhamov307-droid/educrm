import { format, isValid, parseISO } from "date-fns";

function parseValue(value) {
  if (!value) {
    return null;
  }

  const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(parsed) ? parsed : null;
}

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {string}
 */
export function formatDate(value) {
  const parsed = parseValue(value);
  return parsed ? format(parsed, "dd.MM.yyyy") : "";
}

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {string}
 */
export function formatDateTime(value) {
  const parsed = parseValue(value);
  return parsed ? format(parsed, "dd.MM.yyyy HH:mm") : "";
}
