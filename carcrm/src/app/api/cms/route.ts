import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const content = await prisma.siteContent.findMany();
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching CMS content:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    const updated = await prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating CMS content:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
