import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, password, routeFrom, routeTo, distance, price, dateStart, dateEnd, carId } = body;

    // Створюємо або знаходимо користувача
    const user = await prisma.user.upsert({
      where: { email: email || `${phone}@temp.com` }, // fallback if email is empty
      update: { name, phone, password: password || Math.random().toString(36).slice(-8) },
      create: { 
        email: email || `${phone}@temp.com`, 
        name, 
        phone,
        password: password || Math.random().toString(36).slice(-8)
      },
    });

    // Створюємо бронювання
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        carId,
        routeFrom,
        routeTo,
        distance: Number(distance),
        price: Number(price),
        dateStart: new Date(dateStart),
        dateEnd: new Date(dateEnd),
        status: 'PENDING'
      }
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: { client: true, car: true, driver: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
