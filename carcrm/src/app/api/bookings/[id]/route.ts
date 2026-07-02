import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { recalculateChain } from '@/lib/chaining';

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

    // Recalculate chain for this car
    if (updateData.status !== undefined || updateData.driverId !== undefined || updateData.carId !== undefined) {
      // Async recalculation so it doesn't block response
      recalculateChain(booking.carId).catch(err => console.error('Chain calc error:', err));
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
