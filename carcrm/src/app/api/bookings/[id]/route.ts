import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Allow updating status and driverId
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.driverId !== undefined) {
        updateData.driverId = body.driverId === "" ? null : body.driverId;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        car: true,
        driver: { include: { user: true } }
      }
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
