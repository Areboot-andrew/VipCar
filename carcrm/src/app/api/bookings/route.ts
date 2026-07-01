import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, phone, email, password, routeFrom, routeTo, distance, price, dateStart, dateEnd, carId,
      passengers, children, luggage, animals
    } = body;

    const rawPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Створюємо або знаходимо користувача
    const user = await prisma.user.upsert({
      where: { email: email || `${phone}@temp.com` }, // fallback if email is empty
      update: { name, phone }, // Не оновлюємо пароль при кожному бронюванні, якщо юзер вже існує
      create: { 
        email: email || `${phone}@temp.com`, 
        name, 
        phone,
        password: hashedPassword
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
        passengers: Number(passengers),
        children: Number(children),
        luggage,
        animals: Boolean(animals),
        status: 'PENDING'
      }
    });

    // Створюємо інвойс автоматично
    await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        amount: Number(price),
        status: 'UNPAID'
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
