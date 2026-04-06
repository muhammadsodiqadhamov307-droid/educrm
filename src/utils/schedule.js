import { addDays, endOfDay, format, isAfter, isBefore, startOfDay } from "date-fns";

const DAY_TO_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const DAY_TO_KEY = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

/**
 * @param {string | Date | number} value
 * @returns {Date | null}
 */
function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

/**
 * @param {{ days?: string[], time?: string } | undefined} schedule
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function formatGroupSchedule(schedule, t) {
  const days = Array.isArray(schedule?.days)
    ? schedule.days.map((day) => t(`weekdays.short.${DAY_TO_KEY[day] || "mon"}`))
    : [];
  return [days.join(", "), schedule?.time].filter(Boolean).join(" | ");
}

/**
 * @param {{ days?: string[] } | undefined} schedule
 * @param {(key: string) => string} t
 * @returns {string[]}
 */
export function getLocalizedScheduleDays(schedule, t) {
  return Array.isArray(schedule?.days)
    ? schedule.days.map((day) => t(`weekdays.short.${DAY_TO_KEY[day] || "mon"}`))
    : [];
}

/**
 * @param {{
 *  schedule?: { days?: string[] },
 *  startDate?: string | Date,
 *  fromDate?: string | Date | null,
 *  toDate?: string | Date | null,
 *  maxSessions?: number
 * }} params
 * @returns {Date[]}
 */
export function generateScheduledDates({
  schedule,
  startDate,
  fromDate = null,
  toDate = null,
  maxSessions = 30,
}) {
  const scheduleDays = Array.isArray(schedule?.days)
    ? new Set(schedule.days.map((day) => DAY_TO_INDEX[day]).filter((day) => day !== undefined))
    : new Set();
  const parsedStart = parseDate(startDate);
  const parsedFrom = parseDate(fromDate);
  const parsedTo = parseDate(toDate) || new Date();

  if (!parsedStart || scheduleDays.size === 0) {
    return [];
  }

  let cursor = startOfDay(parsedStart);
  const lowerBound = parsedFrom ? startOfDay(parsedFrom) : cursor;
  const upperBound = endOfDay(parsedTo);

  if (isAfter(lowerBound, cursor)) {
    cursor = lowerBound;
  }

  const scheduledDates = [];

  while (!isAfter(cursor, upperBound)) {
    if (scheduleDays.has(cursor.getDay()) && !isBefore(cursor, startOfDay(parsedStart))) {
      scheduledDates.push(new Date(cursor));
    }

    cursor = addDays(cursor, 1);
  }

  return scheduledDates.slice(-maxSessions);
}

/**
 * @param {Date} value
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function formatAttendanceColumnLabel(value, t) {
  const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][value.getDay()];
  return `${t(`weekdays.short.${dayKey}`)}\n${format(value, "dd.MM")}`;
}
