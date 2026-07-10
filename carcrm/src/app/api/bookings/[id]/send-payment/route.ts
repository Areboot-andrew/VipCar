import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { money } from '@/lib/format';

// POST: send a payment request message into the booking chat, so the client
// sees driver, car, full price, deposit, paid amount and payment requisites.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        car: true,
        driver: { include: { user: true } },
        invoice: true,
      },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const settingsRows = await prisma.siteContent.findMany({
      where: { key: { in: ['payment_card', 'payment_usdt', 'deposit_percent'] } },
    });
    const settings = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));

    const amount = Number(booking.invoice?.amount ?? booking.price ?? 0);
    const depositPercent = Number(settings.deposit_percent || 30);
    const deposit = Number(booking.invoice?.depositAmount || 0) || Math.round(amount * (depositPercent / 100));
    const paid = Number(booking.invoice?.paidAmount || 0);
    const remaining = Math.max(0, Math.round(amount - paid));
    const dueNow = paid >= deposit ? remaining : Math.max(0, Math.round(deposit - paid));

    const lines = [
      '💳 Рахунок за поїздку',
      `${booking.routeFrom.split(',')[0]} → ${booking.routeTo.split(',')[0]}`,
      `📅 Подача: ${new Date(booking.pickupAt || booking.dateStart).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
      `🚘 Авто: ${booking.car.make} ${booking.car.model}`,
      `👤 Водій: ${booking.driver?.user?.name || 'буде призначено'}`,
      '—————————',
      `Повна вартість: ${money(amount)}`,
    ];
    if (Number(booking.discountPercent || 0) > 0) {
      lines.push(`Знижка: −${Number(booking.discountPercent).toFixed(0)}% (${money(Number(booking.discountAmount || 0))})`);
    }
    lines.push(`Завдаток (${depositPercent}%): ${money(deposit)}`);
    if (paid > 0) lines.push(`Вже оплачено: ${money(paid)}`);
    lines.push(`До сплати зараз: ${money(dueNow)}`);
    if (remaining > dueNow) lines.push(`Залишок після завдатку: ${money(remaining - dueNow)}`);
    lines.push('—————————');
    const hasRequisites = settings.payment_card || settings.payment_usdt;
    if (hasRequisites) {
      lines.push('Реквізити для оплати:');
      if (settings.payment_card) lines.push(`💳 ${settings.payment_card}`);
      if (settings.payment_usdt) lines.push(`🪙 USDT: ${settings.payment_usdt}`);
    }
    lines.push('Після оплати надішліть, будь ласка, підтвердження у цей чат.');

    let chatRoom = await prisma.chatRoom.findUnique({ where: { bookingId: id } });
    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          bookingId: id,
          platform: 'WEB',
          clientName: booking.client.name,
          clientPhone: booking.client.phone,
        },
      });
    }

    const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });

    const message = await prisma.message.create({
      data: {
        chatRoomId: chatRoom.id,
        senderId: adminUser?.id || null,
        isFromAdmin: true,
        content: lines.join('\n'),
      },
    });

    await prisma.chatRoom.update({ where: { id: chatRoom.id }, data: { updatedAt: new Date() } });

    return NextResponse.json({ ok: true, messageId: message.id });
  } catch (error) {
    console.error('send-payment error:', error);
    return NextResponse.json({ error: 'Failed to send payment request' }, { status: 500 });
  }
}
