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
    if (body.isEndingAtBase !== undefined) updateData.isEndingAtBase = body.isEndingAtBase;
    if (body.driverNotes !== undefined) updateData.driverNotes = body.driverNotes;
    if (body.driverId !== undefined) {
        updateData.driverId = body.driverId === "" ? null : body.driverId;
    }

    const oldBooking = await prisma.booking.findUnique({ where: { id } });

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        car: true,
        driver: { include: { user: true } }
      }
    });

    // Telegram notification to Driver
    if (updateData.driverId && updateData.driverId !== oldBooking?.driverId && booking.driver?.telegramId) {
      try {
        const { getTelegramClient } = await import('@/lib/telegramClient');
        const client = await getTelegramClient();
        if (client) {
          const msg = `🚗 Новий рейс!\n\n📍 ${booking.routeFrom} ➔ ${booking.routeTo}\n📅 ${new Date(booking.dateStart).toLocaleString('uk-UA')}\n👤 Клієнт: ${booking.client.name} (${booking.client.phone})\n🚘 Авто: ${booking.car.make} ${booking.car.model}\n\nЗайдіть у кабінет водія для деталей.`;
          await client.sendMessage(booking.driver.telegramId, { message: msg });
        }
      } catch (e) {
        console.error("Failed to send telegram to driver:", e);
      }
    }

    // Recalculate chain for this car
    if (updateData.status !== undefined || updateData.driverId !== undefined || updateData.carId !== undefined || updateData.isEndingAtBase !== undefined) {
      // Async recalculation so it doesn't block response
      recalculateChain(booking.carId).catch(err => console.error('Chain calc error:', err));
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
