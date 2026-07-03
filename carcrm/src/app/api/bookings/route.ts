import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { recalculateChain } from '@/lib/chaining';

const prisma = new PrismaClient();

import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, phone, email, password, routeFrom, routeTo, routeCountries, distance, price, dateStart, dateEnd, carId,
      passengers, children, childSeats, luggage, animals, petsCount,
      fuelCost, driverSalary, deliveryCost, deliveryDistance, deliveryDurationMins, amortization,
      timeCost, hotelCost, surcharges, netProfit,
      desiredArrivalAt, pickupAt, carDispatchAt, estimatedArrivalAt,
      routeDurationMins, prepBufferMins, customsWaitHours, manualWaitingHours,
      trafficBufferPercent, billableHours, totalExpenseDistance, pricingSnapshot
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
        routeCountries: Array.isArray(routeCountries) ? routeCountries : [],
        distance: Number(distance),
        price: Number(price),
        dateStart: new Date(dateStart),
        dateEnd: new Date(dateEnd),
        desiredArrivalAt: desiredArrivalAt ? new Date(desiredArrivalAt) : null,
        pickupAt: pickupAt ? new Date(pickupAt) : new Date(dateStart),
        carDispatchAt: carDispatchAt ? new Date(carDispatchAt) : null,
        estimatedArrivalAt: estimatedArrivalAt ? new Date(estimatedArrivalAt) : new Date(dateEnd),
        routeDurationMins: Number(routeDurationMins || 0),
        deliveryDurationMins: Number(deliveryDurationMins || 0),
        prepBufferMins: Number(prepBufferMins || 30),
        customsWaitHours: Number(customsWaitHours || 0),
        manualWaitingHours: Number(manualWaitingHours || 0),
        trafficBufferPercent: Number(trafficBufferPercent || 10),
        billableHours: Number(billableHours || 0),
        passengers: Number(passengers),
        children: Number(children),
        childSeats: Number(childSeats || children || 0),
        luggage,
        animals: Boolean(animals),
        petsCount: Number(petsCount || (animals ? 1 : 0)),
        fuelCost: Number(fuelCost || 0),
        driverSalary: Number(driverSalary || 0),
        deliveryCost: Number(deliveryCost || 0),
        deliveryDistance: Number(deliveryDistance || 0),
        amortization: Number(amortization || 0),
        timeCost: Number(timeCost || 0),
        hotelCost: Number(hotelCost || 0),
        surcharges: Number(surcharges || 0),
        netProfit: Number(netProfit || 0),
        totalExpenseDistance: Number(totalExpenseDistance || Number(distance) + Number(deliveryDistance || 0)),
        pricingSnapshot: pricingSnapshot || undefined,
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

    // Trigger async calculation for the car chain
    recalculateChain(carId).catch(err => console.error("Chain calc error on create:", err));

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
