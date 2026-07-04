import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAutoEmptyLegPromotions } from '@/lib/emptyLegs';

export async function GET() {
  try {
    const promos = await prisma.promotion.findMany({
      include: {
        car: {
          include: {
            media: { where: { active: true }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    const autoPromos = await getAutoEmptyLegPromotions();
    return NextResponse.json([...autoPromos, ...promos]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, discount, routeFrom, routeTo, carId, dateStart } = body;

    const promo = await prisma.promotion.create({
      data: {
        title,
        discount: Number(discount),
        routeFrom,
        routeTo,
        carId: carId || null,
        dateStart: dateStart ? new Date(dateStart) : null,
        active: true
      }
    });

    return NextResponse.json(promo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
