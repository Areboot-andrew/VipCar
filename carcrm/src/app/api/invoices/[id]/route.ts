import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { paymentMethodLabel } from "@/lib/format";


export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            client: true,
            car: true
          }
        }
      }
    });
    
    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const current = await prisma.invoice.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.depositAmount !== undefined) data.depositAmount = Number(body.depositAmount) || 0;
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null;
    if (body.paidAmount !== undefined) data.paidAmount = Number(body.paidAmount) || 0;
    if (body.paidAt !== undefined) data.paidAt = body.paidAt ? new Date(body.paidAt) : null;

    // Convenience defaults so the simple status dropdown records payment correctly.
    if (body.status === 'PAID') {
      if (data.paidAmount === undefined) data.paidAmount = current.amount;
      if (data.paidAt === undefined) data.paidAt = new Date();
    }
    if (body.status === 'UNPAID' && body.paidAmount === undefined) {
      data.paidAmount = 0;
      data.paidAt = null;
    }

    const invoice = await prisma.invoice.update({ where: { id }, data });

    // Receipt to the client's booking chat — only when money was actually received.
    // Separate wording per stage: deposit / balance top-up / full payment.
    if (body.notifyClient && invoice.bookingId) {
      try {
        const oldPaid = Number(current.paidAmount || 0);
        const newPaid = Number(invoice.paidAmount || 0);
        const received = Math.max(0, Math.round(newPaid - oldPaid));

        if (received > 0) {
          const booking = await prisma.booking.findUnique({
            where: { id: invoice.bookingId },
            include: { client: true },
          });
          if (booking) {
            const amount = Math.round(Number(invoice.amount || 0));
            const remaining = Math.max(0, Math.round(amount - newPaid));
            const deposit = Number(invoice.depositAmount || 0);
            const method = invoice.paymentMethod ? ` (${paymentMethodLabel(invoice.paymentMethod)})` : '';

            let header: string;
            let bodyLine: string;
            if (remaining === 0 && oldPaid === 0) {
              header = '🧾 Квитанція: повна оплата';
              bodyLine = `Ми отримали вашу оплату €${received}${method}. Поїздку оплачено повністю. Дякуємо!`;
            } else if (remaining === 0) {
              header = '🧾 Квитанція: доплата';
              bodyLine = `Ми отримали доплату €${received}${method}. Поїздку оплачено повністю. Дякуємо!`;
            } else if (oldPaid === 0 && deposit > 0 && received <= deposit) {
              header = '🧾 Квитанція: завдаток';
              bodyLine = `Ми отримали ваш завдаток €${received}${method}. Бронювання закріплено за вами.`;
            } else {
              header = '🧾 Квитанція: часткова оплата';
              bodyLine = `Ми отримали вашу оплату €${received}${method}.`;
            }

            const lines = [
              header,
              `${booking.routeFrom.split(',')[0]} → ${booking.routeTo.split(',')[0]}, ${new Date(booking.dateStart).toLocaleDateString('uk-UA')}`,
              bodyLine,
              `Всього сплачено: €${Math.round(newPaid)} із €${amount}.`,
            ];
            if (remaining > 0) lines.push(`Залишок до сплати: €${remaining}.`);

            let chatRoom = await prisma.chatRoom.findUnique({ where: { bookingId: booking.id } });
            if (!chatRoom) {
              chatRoom = await prisma.chatRoom.create({
                data: { bookingId: booking.id, platform: 'WEB', clientName: booking.client.name, clientPhone: booking.client.phone },
              });
            }
            await prisma.message.create({
              data: { chatRoomId: chatRoom.id, isFromAdmin: true, content: lines.join('\n') },
            });
            await prisma.chatRoom.update({ where: { id: chatRoom.id }, data: { updatedAt: new Date() } });
          }
        }
      } catch (e) {
        console.error('Receipt notify failed:', e);
      }
    }

    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
