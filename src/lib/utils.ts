import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the number of days between the current day and the target date
 * @param endDate - target date as a string in format "YYYY-MM-DD"
 * @returns difference of days
 */
export function getDaysRemaining (endDate: string) {
  const today = new Date();
  const ourDay = new Date(endDate);

  // Get difference between times which is in ms
  const timeInMs = ourDay.getTime() - today.getTime();

  // Convert to days and return
  return Math.ceil(timeInMs / (1000 * 60 * 60 * 24));
}

// Building an Intl.NumberFormat is the expensive part (locale resolution); .format() is
// cheap. These render several times per table row, so construct them once.
const currencyFormatter = Intl.NumberFormat('en-us', {
  style: 'currency',
  currency: 'USD',
});

const amountFormatter = Intl.NumberFormat('en-us', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Converts number to USD currency, symbol included. Use for display text.
 * @param num - number to format can be any value
 * @returns formatted number in USD, e.g. "$1,234.56" (negatives as "-$50.00")
 */
export function toCurrency (num: number) {
  return currencyFormatter.format(num);
}

/**
 * Converts number to a bare money string with no currency symbol. Use inside inputs
 * that already render their own "$" addon, so the user never types the symbol.
 * @param num - number to format can be any value
 * @returns formatted number without a symbol, e.g. "1,234.56"
 */
export function toAmount (num: number) {
  return amountFormatter.format(num);
}

/** Parses a currency string into a usable number */
export function parseMoneyString (value: string): number | null {
  // regex for Decimal(10,2) i.e. 0.00 to 100000000.00
  const numberFormatRegex = /^\d{1,8}(\.\d{1,2})?$/;

  // strip commas and dollar sign (if there is a dollar sign)
  let strippedValue = value.trim().replaceAll(',', '');
  strippedValue = strippedValue.replaceAll('$', '');

  // test value against regex first
  if (!numberFormatRegex.test(strippedValue)) {
    return null;
  }
  
  return Number(strippedValue);
}
