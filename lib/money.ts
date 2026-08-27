// Money is `DECIMAL(10,2)` in Postgres and a string everywhere above it.
//
// node-postgres hands NUMERIC columns back as strings for exactly one reason:
// `Number("8900.00")` reintroduces float error into currency, and a bill that
// is off by a centavo is a bill the front desk has to explain. So pesos stay
// strings from the driver to the screen, and arithmetic happens in integer
// centavos — see lib/pricing.ts.

/** "8900.00" -> "8900.00". Normalises whatever the column gave us. */
export const toMoney = (value: string): string => {
  const [whole = "0", cents = ""] = value.split(".");
  return `${whole}.${cents.slice(0, 2).padEnd(2, "0")}`;
};

const groupDigits = (digits: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * "8900.00" -> "₱8,900" (or "₱8,900.50" when there are real centavos).
 * Operates on the string, so no float ever touches a peso amount.
 */
export const formatPeso = (value: string): string => {
  const raw = toMoney(value);
  const negative = raw.startsWith("-");
  const [whole = "0", cents = "00"] = raw.replace("-", "").split(".");

  const body = cents === "00" ? groupDigits(whole) : `${groupDigits(whole)}.${cents}`;

  return `${negative ? "-" : ""}₱${body}`;
};
