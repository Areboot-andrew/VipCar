import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { carId, dateStart, dateEnd } = await request.json();

    const start = new Date(dateStart);
    const end = new Date(dateEnd);

    // Check if there are any CONFIRMED or PENDING bookings for this car 
    // that overlap with the requested time frame.
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        carId: carId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          // Requested start is within an existing booking
          { dateStart: { lte: start }, dateEnd: { gte: start } },
          // Requested end is within an existing booking
          { dateStart: { lte: end }, dateEnd: { gte: end } },
          // Requested timeframe completely envelops an existing booking
          { dateStart: { gte: start }, dateEnd: { lte: end } },
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}
