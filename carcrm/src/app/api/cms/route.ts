import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const content = await prisma.siteContent.findMany();
    // Повертаємо як об'єкт {key: value}
    const result: Record<string, string> = {
      fuel_price_uah: '60',
      eur_to_uah_rate: '42.5',
      weekend_coefficient: '1.2',
      child_seat_fee: '15',
      animal_fee: '20',
      meet_and_greet_fee: '15',
      luggage_medium_fee: '10',
      luggage_large_fee: '20'
    };
    content.forEach(item => { result[item.key] = item.value; });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching CMS content:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Приймаємо масовий об'єкт {key1: value1, key2: value2, ...}
    const entries = Object.entries(body);
    
    for (const [key, value] of entries) {
      await prisma.siteContent.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    }

    return NextResponse.json({ success: true, count: entries.length });
  } catch (error) {
    console.error('Error updating CMS content:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
