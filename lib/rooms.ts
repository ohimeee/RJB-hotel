import { ReservationStatus } from "@/app/generated/prisma/client";
import type { RoomStatus, RoomType } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatPeso, toMoney } from "@/lib/money";
import type { RoomQuery } from "@/lib/search";

/**
 * What a room looks like once it crosses into a component. `nightlyRate` is a
 * string and `nightlyRateLabel` is display-ready, because `Prisma.Decimal`
 * throws if it reaches a client component. See lib/money.ts.
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

/** SUITE -> Suite */
export const typeLabel = (type: RoomType): string =>
  type.charAt(0) + type.slice(1).toLowerCase();

/** A stay only blocks a room while it is live. Cancelled and closed stays don't. */
const BLOCKING_STATUSES = [
  ReservationStatus.CONFIRMED,
  ReservationStatus.CHECKED_IN,
];

const toRoomCardData = (room: {
  id: string;
  number: string;
  name: string;
  type: RoomType;
  capacity: number;
  amenities: string[];
  description: string | null;
  imageUrl: string | null;
  status: RoomStatus;
  nightlyRate: { toFixed: (digits: number) => string };
}): RoomCardData => ({
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
  const rooms = await prisma.room.findMany({
    where: {
      capacity: { gte: guests },
      ...(checkIn && checkOut
        ? {
            reservations: {
              none: {
                status: { in: BLOCKING_STATUSES },
                checkIn: { lt: new Date(`${checkOut}T00:00:00Z`) },
                checkOut: { gt: new Date(`${checkIn}T00:00:00Z`) },
              },
            },
          }
        : {}),
    },
    orderBy: [{ type: "asc" }, { number: "asc" }],
  });

  return rooms.map(toRoomCardData);
};

export const getRoom = async (id: string): Promise<RoomCardData | null> => {
  const room = await prisma.room.findUnique({ where: { id } });
  return room ? toRoomCardData(room) : null;
};
