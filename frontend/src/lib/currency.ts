/** Currency display conversion — mirrors the backend exchange engine so the
 * UI can preview converted amounts instantly (the backend remains the source
 * of truth on save). PKR is the base display currency.
 */

export const CURRENCY_RATES_PER_USD: Record<string, number> = {
  USD: 1,
  PKR: 278,
  AED: 3.67,
  SAR: 3.75,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.51,
  JPY: 155,
  MYR: 4.7,
  TRY: 34,
  INR: 83.5,
  CNY: 7.25,
};

export const CURRENCY_CODES = Object.keys(CURRENCY_RATES_PER_USD);

export function convertCurrency(amount: number, from: string, to: string): number {
  const value = Number(amount) || 0;
  const fromRate = CURRENCY_RATES_PER_USD[from] ?? 1;
  const toRate = CURRENCY_RATES_PER_USD[to] ?? 1;
  if (from === to) return value;
  return Math.round((value / fromRate) * toRate * 100) / 100;
}