import { NextResponse } from 'next/server';
import { recalculateChain } from '@/lib/chaining';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isEndingAtBase !== undefined) updateData.isEndingAtBase = Boolean(body.isEndingAtBase);
    if (body.returnToBaseAt !== undefined) updateData.returnToBaseAt = body.returnToBaseAt ? new Date(body.returnToBaseAt) : null;
    if (body.returnToBaseDistance !== undefined) updateData.returnToBaseDistance = Number(body.returnToBaseDistance || 0);
    if (body.driverNotes !== undefined) updateData.driverNotes = body.driverNotes;
    if (body.dateStart !== undefined && body.dateStart) {
      updateData.dateStart = new Date(body.dateStart);
      updateData.pickupAt = new Date(body.pickupAt || body.dateStart);
    }
    if (body.dateEnd !== undefined && body.dateEnd) updateData.dateEnd = new Date(body.dateEnd);
    if (body.desiredArrivalAt !== undefined) updateData.desiredArrivalAt = body.desiredArrivalAt ? new Date(body.desiredArrivalAt) : null;
    if (body.carDispatchAt !== undefined) updateData.carDispatchAt = body.carDispatchAt ? new Date(body.carDispatchAt) : null;
    if (body.driverId !== undefined) {
        updateData.driverId = body.driverId === "" ? null : body.driverId;
    }
    // Manual price correction by admin
    if (body.price !== undefined) {
      const priceValue = Number(body.price);
      if (Number.isFinite(priceValue) && priceValue >= 0) updateData.price = priceValue;
    }

    const oldBooking = await prisma.booking.findUnique({ where: { id } });

    let booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        car: true,
        driver: { include: { user: true } },
        invoice: true
      }
    });

    // Price changed: recompute profit and sync the invoice (amount + deposit)
    if (updateData.price !== undefined) {
      const internalCost =
        Number(booking.fuelCost || 0) +
        Number(booking.driverSalary || 0) +
        Number(booking.deliveryCost || 0) +
        Number(booking.amortization || 0) +
        Number(booking.hotelCost || 0);
      const depositRow = await prisma.siteContent.findUnique({ where: { key: 'deposit_percent' } });
      const depositPercent = Number(depositRow?.value || 30);
      const depositAmount = Math.max(0, Math.round(updateData.price * (depositPercent / 100)));

      await prisma.invoice.upsert({
        where: { bookingId: id },
        update: { amount: updateData.price, depositAmount },
        create: { bookingId: id, amount: updateData.price, depositAmount, status: 'UNPAID' },
      });

      booking = await prisma.booking.update({
        where: { id },
        data: { netProfit: Math.round((updateData.price - internalCost) * 100) / 100 },
        include: {
          client: true,
          car: true,
          driver: { include: { user: true } },
          invoice: true
        }
      });
    }

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
    if (
      updateData.status !== undefined ||
      updateData.driverId !== undefined ||
      updateData.carId !== undefined ||
      updateData.isEndingAtBase !== undefined ||
      updateData.returnToBaseAt !== undefined ||
      updateData.returnToBaseDistance !== undefined ||
      updateData.dateStart !== undefined ||
      updateData.dateEnd !== undefined
    ) {
      await recalculateChain(booking.carId);
      const recalculated = await prisma.booking.findUnique({
        where: { id },
        include: {
          client: true,
          car: true,
          driver: { include: { user: true } },
          invoice: true
        }
      });
      if (recalculated) booking = recalculated;
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
