import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const carId = params.id;
    const bookings = await prisma.booking.findMany({
      where: {
        carId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        dateEnd: { gte: new Date() } // only future or ongoing
      },
      select: {
        dateStart: true,
        dateEnd: true
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching booked dates:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
