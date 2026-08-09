import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  RoomStatus,
  RoomType,
} from "../app/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// The Makati property, straight from the design mockups. Rates are in pesos,
// before VAT — the guest side adds it at checkout.
const rooms = [
  {
    number: "402",
    name: "The Garret Suite",
    type: RoomType.SUITE,
    capacity: 2,
    amenities: ["King bed", "Skylight", "Free breakfast"],
    description: "King bed | Top floor | Sleeps 2",
    nightlyRate: 8900,
    status: RoomStatus.OCCUPIED,
  },
  {
    number: "501",
    name: "Atelier Suite",
    type: RoomType.SUITE,
    capacity: 4,
    amenities: ["2 bedrooms", "Kitchenette", "Balcony"],
    description: "Two bedrooms | Kitchenette | Sleeps 4",
    nightlyRate: 10500,
    status: RoomStatus.OCCUPIED,
  },
  {
    number: "201",
    name: "Courtyard Deluxe",
    type: RoomType.DELUXE,
    capacity: 2,
    amenities: ["Queen bed", "Courtyard view", "Minibar"],
    description: "Queen bed | Courtyard view | Sleeps 2",
    nightlyRate: 6400,
    status: RoomStatus.AVAILABLE,
  },
  {
    number: "202",
    name: "Courtyard Deluxe",
    type: RoomType.DELUXE,
    capacity: 2,
    amenities: ["Queen bed", "Courtyard view", "Minibar"],
    description: "Queen bed | Courtyard view | Sleeps 2",
    nightlyRate: 6400,
    status: RoomStatus.OCCUPIED,
  },
  {
    number: "305",
    name: "Loft Deluxe",
    type: RoomType.DELUXE,
    capacity: 3,
    amenities: ["King bed", "Workspace", "Free breakfast"],
    description: "King bed | Loft workspace | Sleeps 3",
    nightlyRate: 7100,
    status: RoomStatus.OCCUPIED,
  },
  {
    number: "104",
    name: "Harbor Standard",
    type: RoomType.STANDARD,
    capacity: 2,
    amenities: ["Twin beds", "City view"],
    description: "Twin beds | City view | Sleeps 2",
    nightlyRate: 4200,
    status: RoomStatus.AVAILABLE,
  },
  {
    number: "103",
    name: "Archive Standard",
    type: RoomType.STANDARD,
    capacity: 1,
    amenities: ["Single bed", "Reading nook"],
    description: "Single bed | Reading nook | Sleeps 1",
    nightlyRate: 3600,
    status: RoomStatus.AVAILABLE,
  },
];

async function main() {
  // Upsert on number so re-running the seed refreshes rooms instead of
  // duplicating them or tripping the unique constraint.
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { number: room.number },
      update: room,
      create: room,
    });
  }

  const total = await prisma.room.count();
  console.log(`Seeded ${rooms.length} rooms. Room table now holds ${total}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
