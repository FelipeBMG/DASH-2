import type { FlowCard } from "@/types/axion";

type DateRange = { start: string; end: string };

function withinRange(isoDate: string, start: string, end: string) {
  // ISO yyyy-mm-dd string compare works lexicographically.
  return isoDate >= start && isoDate <= end;
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function isDefaultDateRange(range: DateRange) {
  const now = new Date();
  const defaultStart = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultEnd = toISODate(now);
  return range.start === defaultStart && range.end === defaultEnd;
}

export function shouldShowConcludedCard(card: FlowCard, opts: { isCustomDateRange: boolean }) {
  if (opts.isCustomDateRange) return true;
  const updatedAtMs = new Date(card.updatedAt).getTime();
  const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
  return updatedAtMs >= cutoffMs;
}

export function shouldShowByDateRange(card: FlowCard, range: DateRange, opts: { isCustomDateRange: boolean }) {
  if (!opts.isCustomDateRange) return true;
  return withinRange((card.date || "").slice(0, 10), range.start, range.end);
}
