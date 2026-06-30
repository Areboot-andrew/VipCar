import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      where: { active: true },
      include: {
        user: true
      }
    });
    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
