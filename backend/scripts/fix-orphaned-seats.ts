import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for orphaned unavailable seats...\n");

  // Find all seats marked as unavailable
  const unavailableSeats = await prisma.seat.findMany({
    where: {
      is_available: false,
    },
    include: {
      flight: {
        select: {
          flight_id: true,
          departure_time: true,
          route: {
            select: {
              origin_airport_code: true,
              destination_airport_code: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${unavailableSeats.length} unavailable seats`);

  if (unavailableSeats.length === 0) {
    console.log("No unavailable seats found. All good!");
    return;
  }

  // Check which ones have active bookings
  const orphanedSeats = [];
  
  for (const seat of unavailableSeats) {
    const booking = await prisma.booking.findFirst({
      where: {
        flight_id: seat.flight_id,
        seat_number: seat.seat_number,
        status: "confirmed", // Only count confirmed bookings
      },
    });

    if (!booking) {
      // This seat is unavailable but has no confirmed booking
      orphanedSeats.push(seat);
      console.log(
        `Orphaned seat: ${seat.seat_number} on flight ${seat.flight_id} ` +
        `(${seat.flight.route.origin_airport_code} -> ${seat.flight.route.destination_airport_code}) ` +
        `on ${seat.flight.departure_time.toISOString()}`
      );
    }
  }

  if (orphanedSeats.length === 0) {
    console.log("\nNo orphaned seats found. All unavailable seats have confirmed bookings.");
    return;
  }

  console.log(`\nFound ${orphanedSeats.length} orphaned seats (unavailable but no confirmed booking)`);
  console.log("Fixing orphaned seats...");

  // Fix orphaned seats by making them available again
  const result = await prisma.seat.updateMany({
    where: {
      OR: orphanedSeats.map(seat => ({
        flight_id: seat.flight_id,
        seat_number: seat.seat_number,
      })),
    },
    data: {
      is_available: true,
    },
  });

  console.log(`\nFixed ${result.count} orphaned seats. They are now available for booking.`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
