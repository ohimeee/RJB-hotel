import { query, queryOne } from "@/lib/db";
import { formatPeso, toMoney } from "@/lib/money";
import type { RoomStatus, RoomType } from "@/lib/types";
import type { RoomQuery } from "@/lib/search";

/**
 * What a room looks like once it crosses into a component. `nightlyRate` is a
 * string and `nightlyRateLabel` is display-ready — money never becomes a float
 * on the way up. See lib/money.ts.
 */
export type RoomCardData = {
  id: string;
  number: string;
  name: string;
  type: RoomType;
  capacity: number;
  amenities: string[];
  description: string | null;
  imageUrl: string | null;
  status: RoomStatus;
  nightlyRate: string;
  nightlyRateLabel: string;
};

/** A row of the `Room` table, as node-postgres hands it back. */
type RoomRow = Omit<RoomCardData, "nightlyRateLabel">;

/** SUITE -> Suite */
export const typeLabel = (type: RoomType): string =>
  type.charAt(0) + type.slice(1).toLowerCase();

const ROOM_COLUMNS = `
  "id",
  "number",
  "name",
  "type",
  "capacity",
  "amenities",
  "description",
  "imageUrl",
  "status",
  "nightlyRate"
`;

const toRoomCardData = (room: RoomRow): RoomCardData => ({
  ...room,
  nightlyRate: toMoney(room.nightlyRate),
  nightlyRateLabel: formatPeso(room.nightlyRate),
});

/**
 * Rooms that sleep at least `guests`, minus anything already booked across the
 * requested range.
 *
 * Overlap is half-open: an existing stay collides when it starts before the
 * requested check-out AND ends after the requested check-in. So a guest
 * departing on the 11th does not block an arrival on the 11th.
 *
 * A stay only blocks a room while it is live — CANCELLED and CHECKED_OUT stays
 * are ignored.
 *
 * With no date range this is the plain catalog — a first-time visitor should
 * see rooms, not an empty page demanding dates.
 *
 * Note `Room.status` is deliberately not consulted. That field is housekeeping's
 * "is someone physically in there right now", not a statement about future
 * availability; using it here would hide every occupied room from next month's
 * search.
 */
export const findAvailableRooms = async ({
  checkIn,
  checkOut,
  guests,
}: RoomQuery): Promise<RoomCardData[]> => {
  const hasRange = Boolean(checkIn && checkOut);

  // The whole date filter hangs off `$2 IS NOT NULL`, so one statement covers
  // both the searched and the browse-everything case.
  const rows = await query<RoomRow>(
    `
    SELECT ${ROOM_COLUMNS}
    FROM "Room" r
    WHERE r."capacity" >= $1
      AND (
        $2::date IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM "Reservation" res
          WHERE res."roomId" = r."id"
            AND res."status" IN ('CONFIRMED', 'CHECKED_IN')
            AND res."checkIn" < $3::date
            AND res."checkOut" > $2::date
        )
      )
    ORDER BY r."type" ASC, r."number" ASC
    `,
    [guests, hasRange ? checkIn : null, hasRange ? checkOut : null],
  );

  return rows.map(toRoomCardData);
};

export const getRoom = async (id: string): Promise<RoomCardData | null> => {
  const room = await queryOne<RoomRow>(
    `SELECT ${ROOM_COLUMNS} FROM "Room" WHERE "id" = $1`,
    [id],
  );

  return room ? toRoomCardData(room) : null;
};
