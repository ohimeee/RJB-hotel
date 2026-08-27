// The database enums, mirrored in TypeScript. `db/schema.sql` is the source of
// truth; these exist so components can name a room type without a generated
// client.

export const ROOM_TYPES = ["STANDARD", "DELUXE", "SUITE"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_STATUSES = ["AVAILABLE", "OCCUPIED"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const RESERVATION_STATUSES = [
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
