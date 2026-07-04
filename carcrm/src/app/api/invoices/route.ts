import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        booking: {
          include: {
            client: true,
            car: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
