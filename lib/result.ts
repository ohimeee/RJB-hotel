/**
 * A thrown error, as a value.
 *
 * Failure is reported by returning it almost everywhere in this app —
 * `BookingResult` in lib/reservations.ts is the pattern, and it is what lets a
 * caller handle every outcome without a try/catch. Two boundaries cannot do
 * that on their own: `fetch` and `Request.json()` throw, and a `catch` block
 * has no way to hand a value to the code after it except through a mutable
 * binding. This is that binding, confined to one small function rather than
 * repeated at each call site.
 */
export type Result<T, E = unknown> =
  { ok: true; value: T } | { ok: false; error: E };

/**
 * Run `fn` and report what it did — returned or threw — as a Result.
 *
 * Not for calls that throw *deliberately* as control flow: Next's `redirect()`
 * and `notFound()` signal by throwing, and catching them here would swallow the
 * navigation instead of performing it. Wrap the I/O, leave those outside.
 */
export const attempt = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error };
  }
};
