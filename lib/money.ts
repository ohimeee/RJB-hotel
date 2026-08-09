// Money is `Decimal` in Postgres and a string everywhere above it.
//
// Two rules hold the line:
//   1. `Prisma.Decimal` is not serializable across the server/client boundary —
//      passing one into a client component throws at runtime.
//   2. Never `Number(decimal)`. That reintroduces float error into currency.
//
// So Decimals convert to strings once, here, and stay strings.

/** Structural, so this file does not import from the generated client. */
type DecimalLike = { toFixed: (digits: number) => string };

/** Decimal -> "8900.00". The canonical wire format. */
export const toMoney = (value: DecimalLike): string => value.toFixed(2);

const groupDigits = (digits: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * "8900.00" -> "₱8,900" (or "₱8,900.50" when there are real centavos).
 * Operates on the string, so no float ever touches a peso amount.
 */
export const formatPeso = (value: DecimalLike | string): string => {
  const raw = typeof value === "string" ? value : toMoney(value);
  const negative = raw.startsWith("-");
  const [whole = "0", cents = "00"] = raw.replace("-", "").split(".");

  const body = cents === "00" ? groupDigits(whole) : `${groupDigits(whole)}.${cents}`;

  return `${negative ? "-" : ""}₱${body}`;
};
