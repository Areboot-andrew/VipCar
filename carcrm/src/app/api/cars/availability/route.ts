import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { carId, dateStart, dateEnd, checks } = await request.json();

    if (Array.isArray(checks)) {
      const results: Record<string, boolean> = {};
      await Promise.all(checks.map(async (check: { carId: string; dateStart: string; dateEnd: string }) => {
        const start = new Date(check.dateStart);
        const end = new Date(check.dateEnd);
        if (!check.carId || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          results[check.carId] = false;
          return;
        }

        const conflictingBookings = await prisma.booking.findFirst({
          where: {
            carId: check.carId,
            status: { in: ['CONFIRMED', 'PENDING'] },
            OR: [
              { dateStart: { lte: start }, dateEnd: { gte: start } },
              { dateStart: { lte: end }, dateEnd: { gte: end } },
              { dateStart: { gte: start }, dateEnd: { lte: end } },
            ]
          },
          select: { id: true },
        });

        results[check.carId] = !conflictingBookings;
      }));

      return NextResponse.json({ results });
    }

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
