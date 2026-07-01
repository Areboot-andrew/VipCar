import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cars = await prisma.car.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { make, model, year, capacity, baseRate, fuelType, fuelConsumptionCity, fuelConsumptionHighway, selfDriveAllowed, status, images, videos } = body;

    const car = await prisma.car.create({
      data: {
        make,
        model,
        year: parseInt(year),
        capacity: parseInt(capacity),
        baseRate: parseFloat(baseRate),
        fuelType,
        fuelConsumptionCity: parseFloat(fuelConsumptionCity),
        fuelConsumptionHighway: parseFloat(fuelConsumptionHighway),
        selfDriveAllowed: Boolean(selfDriveAllowed),
        status: status || 'AVAILABLE',
        images: images || [],
        videos: videos || [],
      },
    });

    return NextResponse.json(car, { status: 201 });
  } catch (error) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 });
  }
}
