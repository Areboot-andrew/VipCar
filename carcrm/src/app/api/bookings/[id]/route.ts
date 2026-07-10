import { NextResponse } from 'next/server';
import { recalculateChain } from '@/lib/chaining';
import { prisma } from '@/lib/prisma';
import { shortPlace } from '@/lib/format';

const round2 = (value: number) => Math.round(value * 100) / 100;

type FullBooking = NonNullable<Awaited<ReturnType<typeof fetchBooking>>>;

function fetchBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      client: true,
      car: true,
      driver: { include: { user: true } },
      invoice: true,
    },
  });
}

// Posts a message into the booking's web chat (the client sees it in the cabinet).
async function postToBookingChat(booking: FullBooking, content: string) {
  let chatRoom = await prisma.chatRoom.findUnique({ where: { bookingId: booking.id } });
  if (!chatRoom) {
    chatRoom = await prisma.chatRoom.create({
      data: {
        bookingId: booking.id,
        platform: 'WEB',
        clientName: booking.client.name,
        clientPhone: booking.client.phone,
      },
    });
  }
  await prisma.message.create({
    data: { chatRoomId: chatRoom.id, isFromAdmin: true, content },
  });
  await prisma.chatRoom.update({ where: { id: chatRoom.id }, data: { updatedAt: new Date() } });
}

// Trip details for the client: driver, phone, car + plate, pickup time, payment state.
function clientTripMessage(booking: FullBooking, headline: string) {
  const paid = Number(booking.invoice?.paidAmount || 0);
  const price = Number(booking.price || 0);
  const remaining = Math.max(0, Math.round(price - paid));
  const plate = booking.car.plateNumber ? `, держномер ${booking.car.plateNumber}` : '';
  const driverLine = booking.driver?.user
    ? `👤 Водій: ${booking.driver.user.name}${booking.driver.user.phone ? `, тел. ${booking.driver.user.phone}` : ''}`
    : '👤 Водія буде призначено найближчим часом — повідомимо в цьому чаті';
  const payLine = remaining === 0
    ? `💶 Вартість: €${Math.round(price)} — оплачено повністю. Дякуємо!`
    : `💶 Вартість: €${Math.round(price)}${paid > 0 ? `, сплачено €${Math.round(paid)}` : ''}, залишок €${remaining}`;

  return [
    headline,
    `${shortPlace(booking.routeFrom)} → ${shortPlace(booking.routeTo)}`,
    `📅 Подача: ${new Date(booking.pickupAt || booking.dateStart).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
    `🚘 Авто: ${booking.car.make} ${booking.car.model}${plate}`,
    driverLine,
    payLine,
    'Якщо плани зміняться — просто напишіть у цей чат.',
  ].join('\n');
}

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

    // Price changed: sync the invoice (amount + deposit); profit is recomputed below
    if (updateData.price !== undefined) {
      const depositRow = await prisma.siteContent.findUnique({ where: { key: 'deposit_percent' } });
      const depositPercent = Number(depositRow?.value || 30);
      const depositAmount = Math.max(0, Math.round(updateData.price * (depositPercent / 100)));

      await prisma.invoice.upsert({
        where: { bookingId: id },
        update: { amount: updateData.price, depositAmount },
        create: { bookingId: id, amount: updateData.price, depositAmount, status: 'UNPAID' },
      });
    }

    // Recalculate the chain for this car (delivery/return distances, fuel)
    const needsChainRecalc =
      updateData.status !== undefined ||
      updateData.driverId !== undefined ||
      updateData.carId !== undefined ||
      updateData.isEndingAtBase !== undefined ||
      updateData.returnToBaseAt !== undefined ||
      updateData.returnToBaseDistance !== undefined ||
      updateData.dateStart !== undefined ||
      updateData.dateEnd !== undefined;

    if (needsChainRecalc) {
      await recalculateChain(booking.carId);
    }

    // Finance completion: return-leg hours, driver salary (km + hours),
    // overnight stay for long trips and the resulting net profit.
    if (needsChainRecalc || updateData.price !== undefined) {
      const fresh = await fetchBooking(id);
      if (fresh) {
        const settingsRows = await prisma.siteContent.findMany({
          where: { key: { in: ['pricing_hotel_after_hours', 'pricing_hotel_cost_per_night'] } },
        });
        const sMap = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
        const hotelAfterHours = Number(sMap.pricing_hotel_after_hours || 10);
        const hotelPerNight = Number(sMap.pricing_hotel_cost_per_night || 90);

        const returnMins = fresh.returnToBaseDistance ? Math.ceil((Number(fresh.returnToBaseDistance) / 55) * 60) : 0;
        const speedFactor = Math.max(0.5, 1 - Number(fresh.trafficBufferPercent ?? 10) / 100);
        const adjustedRouteMins = Math.ceil(Number(fresh.routeDurationMins || 0) / speedFactor);
        const billableHours = round2(((adjustedRouteMins + returnMins) / 60) + Number(fresh.customsWaitHours || 0) + Number(fresh.manualWaitingHours || 0));
        const totalKm = Number(fresh.totalExpenseDistance || fresh.distance || 0);
        const driverSalary = round2(totalKm * Number(fresh.driver?.salaryPerKm ?? 0.15) + billableHours * Number(fresh.driver?.salaryPerHour ?? 12));
        const hotelCost = billableHours > hotelAfterHours ? Number(fresh.driver?.overnightAllowance ?? hotelPerNight) : 0;
        const internalCost = Number(fresh.fuelCost || 0) + driverSalary + Number(fresh.deliveryCost || 0) + Number(fresh.amortization || 0) + hotelCost;
        const netProfit = round2(Number(fresh.price || 0) - internalCost);

        booking = await prisma.booking.update({
          where: { id },
          data: { billableHours, driverSalary, hotelCost, netProfit },
          include: {
            client: true,
            car: true,
            driver: { include: { user: true } },
            invoice: true
          }
        });
      }
    }

    // Telegram to the driver: trip + how much to collect from the client
    if (updateData.driverId && updateData.driverId !== oldBooking?.driverId && booking.driver?.telegramId) {
      try {
        const { getTelegramClient } = await import('@/lib/telegramClient');
        const client = await getTelegramClient();
        if (client) {
          const paid = Number(booking.invoice?.paidAmount || 0);
          const remaining = Math.max(0, Math.round(Number(booking.price || 0) - paid));
          const payLine = remaining === 0
            ? '💶 Поїздка оплачена повністю — нічого не отримувати.'
            : `💶 Отримати від клієнта: €${remaining} (ціна €${Math.round(Number(booking.price || 0))}, сплачено €${Math.round(paid)}).`;
          const msg = `🚗 Новий рейс!\n\n📍 ${booking.routeFrom} ➔ ${booking.routeTo}\n📅 ${new Date(booking.dateStart).toLocaleString('uk-UA')}\n👤 Клієнт: ${booking.client.name} (${booking.client.phone})\n🚘 Авто: ${booking.car.make} ${booking.car.model}\n${payLine}\n\nЗайдіть у кабінет водія для деталей.`;
          await client.sendMessage(booking.driver.telegramId, { message: msg });
        }
      } catch (e) {
        console.error("Failed to send telegram to driver:", e);
      }
    }

    // Message to the client: confirmation or driver change on a confirmed trip
    try {
      const becameConfirmed = updateData.status === 'CONFIRMED' && oldBooking?.status !== 'CONFIRMED';
      const driverChangedOnConfirmed =
        updateData.driverId !== undefined &&
        updateData.driverId !== oldBooking?.driverId &&
        booking.status === 'CONFIRMED' &&
        !becameConfirmed;

      if (becameConfirmed) {
        await postToBookingChat(booking, clientTripMessage(booking, '✅ Вашу поїздку підтверджено!'));
      } else if (driverChangedOnConfirmed) {
        await postToBookingChat(booking, clientTripMessage(booking, '🔄 Оновлення по вашій поїздці: призначено водія.'));
      }
    } catch (e) {
      console.error('Failed to notify client:', e);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
