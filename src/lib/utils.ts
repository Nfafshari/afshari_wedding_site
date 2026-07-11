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

/** 
 * Converts number to USD currency
 * @param num - number to format can be any value
 * @returns formatted number in USD
 */
export function toCurrency (num: number) {
  return Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' }).format(num);
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
