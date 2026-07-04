import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: 'ACTIVE' },
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
