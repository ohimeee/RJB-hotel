import { isDateString } from "@/lib/dates";

export const MIN_GUESTS = 1;
export const MAX_GUESTS = 4;

export type RawSearchParams = {
  checkIn?: string | string[];
  checkOut?: string | string[];
  guests?: string | string[];
};

export type RoomQuery = {
  /** Both dates or neither — a half-filled range cannot filter availability. */
  checkIn?: string;
  checkOut?: string;
  guests: number;
};

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Query strings are user input: `?guests=abc`, `?checkOut=1999-01-01`, or a
 * repeated key arriving as an array. This normalises rather than throws — a
 * malformed URL falls back to the full catalog instead of an error page.
 */
export const parseSearch = (raw: RawSearchParams): RoomQuery => {
  const checkInRaw = first(raw.checkIn);
  const checkOutRaw = first(raw.checkOut);

  const checkIn = isDateString(checkInRaw) ? checkInRaw : undefined;
  const checkOut = isDateString(checkOutRaw) ? checkOutRaw : undefined;

  const parsedGuests = Number(first(raw.guests));
  const guests = Number.isFinite(parsedGuests)
    ? Math.min(Math.max(Math.trunc(parsedGuests), MIN_GUESTS), MAX_GUESTS)
    : MIN_GUESTS;

  // `YYYY-MM-DD` sorts lexically, so this ordering check needs no Date objects
  // and therefore has no timezone behaviour.
  const hasRange = Boolean(checkIn && checkOut && checkIn < checkOut);

  return hasRange ? { checkIn, checkOut, guests } : { guests };
};

/**
 * Link from a room card into checkout. The chosen dates ride along in the URL
 * so the two pages agree without any client state; checkout falls back to a
 * default stay when the catalog was browsed without dates.
 */
export const checkoutHref = (roomId: string, query: RoomQuery): string => {
  const params = new URLSearchParams({ room: roomId, guests: String(query.guests) });
  if (query.checkIn && query.checkOut) {
    params.set("checkIn", query.checkIn);
    params.set("checkOut", query.checkOut);
  }
  return `/my-bookings?${params.toString()}`;
};
