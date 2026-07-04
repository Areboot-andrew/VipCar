import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { calculateBookingQuote } from '@/lib/bookingQuote';

// POST: server-side price preview for the booking modal —
// the client sees exactly the price the booking will be created with.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.carId) {
      return NextResponse.json({ error: 'carId required' }, { status: 400 });
    }

    // Personal discount of the logged-in client (guests get 0)
    let personalDiscountPercent = 0;
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { personalDiscountPercent: true },
      });
      personalDiscountPercent = Number(user?.personalDiscountPercent || 0);
    }

    const quote = await calculateBookingQuote({
      carId: body.carId,
      routeFrom: body.routeFrom,
      routeTo: body.routeTo,
      routeCountries: body.routeCountries,
      distance: body.distance,
      distanceCity: body.distanceCity,
      distanceHighway: body.distanceHighway,
      durationMins: body.durationMins,
      originLat: body.originLat,
      originLng: body.originLng,
      destinationLat: body.destinationLat,
      destinationLng: body.destinationLng,
      arrivalDate: body.arrivalDate,
      passengers: body.passengers,
      children: body.children,
      childSeats: body.childSeats,
      petsCount: body.petsCount,
      meetAndGreet: Boolean(body.meetAndGreet),
      withDriver: true,
      promotionId: body.promotionId || null,
      promoCode: body.promoCode || null,
      personalDiscountPercent,
    });

    return NextResponse.json({
      price: quote.pricing.price,
      depositAmount: quote.depositAmount,
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount,
      pickupAt: quote.pricing.pickupAt,
      carDispatchAt: quote.pricing.carDispatchAt,
    });
  } catch (error) {
    console.error('quote error:', error);
    return NextResponse.json({ error: 'Failed to calculate quote' }, { status: 500 });
  }
}
