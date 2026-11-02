/*
 * Field checks shared by the planner's dialogs (instant feedback) and its server actions
 * (the real guard), so both say exactly the same thing. Each returns the message to show,
 * or null when the value is fine. No Prisma or server imports: this file ships to the browser.
 *
 * Dialogs parse their text first (parseWholeNumber, parseMoneyString(v) ?? NaN), so a typo
 * gets the same message the server would give for a bad number.
 */

import { parseHttpUrl } from '@/lib/utils';

/** Largest amount a money column (Decimal(10,2)) holds, exclusive. */
export const MAX_MONEY = 100_000_000;

/** "Item name cannot be empty.", and an optional length limit. */
export function checkRequired (value: string, label: string, max?: number): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return `${label} cannot be empty.`;
  if (max !== undefined && trimmed.length > max) return `${label} must be ${max} characters or less.`;
  return null;
}

/**
 * Refuses a name another item already uses, ignoring case and surrounding spaces.
 * When editing, leave the item's own current name out of `existing`.
 * @param noun - what the name belongs to: "item", "category"
 * @param where - narrows the message, e.g. "in this category"
 */
export function checkUniqueName (value: string, existing: string[], noun: string, where?: string): string | null {
  const key = value.trim().toLowerCase();
  if (!existing.some((name) => name.trim().toLowerCase() === key)) return null;
  const article = /^[aeiou]/i.test(noun) ? 'An' : 'A';
  return `${article} ${noun} with that name already exists${where ? ` ${where}` : ''}.`;
}

/** Bounds a quantity or count to 1..max. NaN (unparseable input) fails the first check. */
export function checkWholeNumber (value: number, label: string, max: number): string | null {
  if (!Number.isInteger(value) || value < 1) return `${label} must be a whole number of 1 or more.`;
  if (value > max) return `${label} must be ${max} or less.`;
  return null;
}

/** An amount of money from 0 up to (not including) MAX_MONEY. NaN fails. */
export function checkMoney (value: number, label: string): string | null {
  if (!Number.isFinite(value) || value < 0) return `${label} must be a number of 0 or more.`;
  if (value >= MAX_MONEY) return `${label} must be less than $100,000,000.`;
  return null;
}

/**
 * A plain http(s) address. These values are rendered into an href or src, so a
 * `javascript:` URL here would run on click.
 */
export function checkHttpUrl (value: string, label: string): string | null {
  return parseHttpUrl(value) === null ? `${label} must be a valid link starting with http:// or https://.` : null;
}

/** A date was chosen and is a real one. */
export function checkDate (value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return 'Please select a date.';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Please select a date.' : null;
}

/** Digits only (commas allowed) to a number; anything else is NaN, so checkWholeNumber refuses it. */
export function parseWholeNumber (value: string): number {
  const stripped = value.trim().replaceAll(',', '');
  return /^\d+$/.test(stripped) ? Number(stripped) : Number.NaN;
}
