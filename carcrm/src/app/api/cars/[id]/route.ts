import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { carSlug } from '@/lib/slug';

const prisma = new PrismaClient();

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const car = await prisma.car.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
      include: {
        reviews: true,
        media: { where: { active: true }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
        defaultDriver: { include: { user: true } },
      },
    });
    if (!car) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(car);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const car = await prisma.car.findFirst({ where: { OR: [{ id: params.id }, { slug: params.id }] } });
    if (!car) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.car.delete({ where: { id: car.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();
    const existing = await prisma.car.findFirst({ where: { OR: [{ id: params.id }, { slug: params.id }] } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const numberFields = [
      'year',
      'capacity',
      'luggageCapacity',
      'largeLuggageCapacity',
      'baseRate',
      'fuelConsumptionCity',
      'fuelConsumptionHighway',
      'fuelTankVolume',
      'pricePerPerson',
      'crossBorderFee',
      'meetAndGreetFee',
      'animalFee',
      'childSeatFee',
      'baseLat',
      'baseLng',
    ];

    const data: Record<string, any> = {};
    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined) return;
      if (numberFields.includes(key)) {
        data[key] = value === '' || value === null ? null : Number(value);
      } else {
        data[key] = value;
      }
    });

    if (!data.slug && (data.make || data.model || data.year)) {
      data.slug = carSlug(data.make || existing.make, data.model || existing.model, data.year || existing.year);
    }

    const car = await prisma.car.update({
      where: { id: existing.id },
      data,
      include: {
        reviews: true,
        media: { orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
        defaultDriver: { include: { user: true } },
      },
    });
    return NextResponse.json(car);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
