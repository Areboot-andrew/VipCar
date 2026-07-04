import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { recalculateChain } from '@/lib/chaining';
import { calculateBookingQuote } from '@/lib/bookingQuote';
import { prisma } from '@/lib/prisma';
import { isCarAvailableForInterval } from '@/lib/bookingAvailability';
import { notifyAdminTelegram } from '@/lib/telegramNotify';

import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, phone, email, password, routeFrom, routeTo, routeCountries, distance, carId,
      passengers, children, childSeats, luggage, animals, petsCount, meetAndGreet, notes,
      desiredArrivalAt, dateStart, dateEnd, isEndingAtBase, promoCode, promotionId, discountPercent,
      routeDurationMins, distanceCity, distanceHighway, originLat, originLng, destinationLat, destinationLng
    } = body;

    // Existing client may have a personal loyalty discount assigned by the admin.
    const existingUser = email
      ? await prisma.user.findUnique({ where: { email }, select: { personalDiscountPercent: true } })
      : null;

    const quote = await calculateBookingQuote({
      carId,
      routeFrom,
      routeTo,
      routeCountries,
      distance,
      distanceCity,
      distanceHighway,
      durationMins: routeDurationMins,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      arrivalDate: desiredArrivalAt || dateEnd,
      passengers,
      children,
      childSeats,
      petsCount: petsCount || (animals ? 1 : 0),
      meetAndGreet,
      withDriver: true,
      promotionId,
      promoCode,
      discountPercent,
      personalDiscountPercent: existingUser?.personalDiscountPercent ?? 0,
      isEndingAtBase,
    });

    const pricing = quote.pricing;
    const pickupAt = pricing.pickupAt || (dateStart ? new Date(dateStart) : new Date());
    const arrivalAt = pricing.estimatedArrivalAt || (desiredArrivalAt ? new Date(desiredArrivalAt) : dateEnd ? new Date(dateEnd) : pickupAt);
    const occupiedFrom = pricing.carDispatchAt || pickupAt;
    const occupiedTo = pricing.returnToBaseAt || arrivalAt;

    const available = await isCarAvailableForInterval(carId, occupiedFrom, occupiedTo);
    if (!available) {
      return NextResponse.json({ error: 'Car is not available for this time window' }, { status: 409 });
    }

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
        driverId: quote.car.defaultDriverId || null,
        routeFrom,
        routeTo,
        routeCountries: Array.isArray(routeCountries) ? routeCountries : [],
        originLat: quote.origin?.lat ?? null,
        originLng: quote.origin?.lng ?? null,
        destinationLat: quote.destination?.lat ?? null,
        destinationLng: quote.destination?.lng ?? null,
        distance: Number(distance),
        price: pricing.price,
        promotionId: quote.promotion?.id || null,
        promoCode: quote.promoCode,
        discountPercent: quote.discountPercent,
        discountAmount: quote.discountAmount,
        dateStart: pickupAt,
        dateEnd: arrivalAt,
        desiredArrivalAt: arrivalAt,
        pickupAt,
        carDispatchAt: pricing.carDispatchAt,
        estimatedArrivalAt: arrivalAt,
        routeDurationMins: Number(routeDurationMins || 0),
        deliveryDurationMins: pricing.deliveryDurationMins,
        prepBufferMins: pricing.prepBufferMins,
        customsWaitHours: pricing.customsWaitHours,
        manualWaitingHours: pricing.manualWaitingHours,
        trafficBufferPercent: pricing.trafficBufferPercent,
        billableHours: pricing.billableHours,
        passengers: Number(passengers),
        children: Number(children),
        childSeats: Number(childSeats || children || 0),
        luggage,
        animals: Boolean(animals),
        petsCount: Number(petsCount || (animals ? 1 : 0)),
        fuelCost: pricing.fuelCost,
        driverSalary: pricing.driverSalary,
        deliveryCost: pricing.deliveryCost,
        deliveryDistance: pricing.deliveryDistance,
        amortization: pricing.amortization,
        timeCost: pricing.timeCost,
        hotelCost: pricing.hotelCost,
        surcharges: pricing.surcharges,
        netProfit: pricing.netProfit,
        totalExpenseDistance: pricing.totalExpenseDistance,
        isEndingAtBase: quote.isEndingAtBase,
        returnToBaseDistance: pricing.returnToBaseDistance,
        returnToBaseAt: pricing.returnToBaseAt,
        pricingSnapshot: pricing.pricingSnapshot as Prisma.InputJsonValue,
        status: 'PENDING',
        notes: notes || null
      }
    });

    // Створюємо інвойс автоматично (з розрахованим завдатком)
    await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        amount: pricing.price,
        depositAmount: quote.depositAmount,
        status: 'UNPAID'
      }
    });

    // Trigger async calculation for the car chain
    recalculateChain(carId).catch(err => console.error("Chain calc error on create:", err));

    // Сповіщення адміну про нову заявку
    notifyAdminTelegram(
      `🚗 Нова заявка на бронювання!\n\n📍 ${routeFrom} → ${routeTo}\n📅 Подача: ${pickupAt.toLocaleString('uk-UA')}\n🚘 ${quote.car.make} ${quote.car.model}\n👤 ${name}, ${phone}\n💶 Ціна: €${pricing.price} (завдаток €${quote.depositAmount})${quote.discountPercent > 0 ? `\n🏷 Знижка: -${quote.discountPercent}%` : ''}`
    ).catch(() => {});

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: { client: true, car: true, driver: { include: { user: true } }, promotion: true, invoice: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
