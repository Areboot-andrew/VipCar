import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";


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
    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
