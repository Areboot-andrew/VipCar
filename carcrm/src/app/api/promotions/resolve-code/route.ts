import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET ?code=...&carId=... -> live promo-code check for the calculator
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = (url.searchParams.get('code') || '').trim();
    const carId = url.searchParams.get('carId') || '';
    if (!code) return NextResponse.json({ percent: 0 });

    const promo = await prisma.promotion.findFirst({
      where: { active: true, code: { equals: code, mode: 'insensitive' } },
    });

    if (!promo || (promo.carId && carId && promo.carId !== carId)) {
      return NextResponse.json({ percent: 0 });
    }

    return NextResponse.json({
      percent: Number(promo.discount || 0),
      title: promo.title,
      routeFrom: promo.routeFrom,
      routeTo: promo.routeTo,
    });
  } catch (error) {
    return NextResponse.json({ percent: 0 });
  }
}
