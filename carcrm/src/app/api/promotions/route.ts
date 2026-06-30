import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const promos = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(promos);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, discount, routeFrom, routeTo } = body;

    const promo = await prisma.promotion.create({
      data: {
        title,
        description,
        discount: Number(discount),
        routeFrom,
        routeTo,
        active: true
      }
    });

    return NextResponse.json(promo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
