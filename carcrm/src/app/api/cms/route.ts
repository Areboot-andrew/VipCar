import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getMissingContentDefaults, withContentDefaults } from '@/lib/contentDefaults';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const content = await prisma.siteContent.findMany();
    const result: Record<string, string> = {};
    content.forEach(item => { result[item.key] = item.value; });

    const missingDefaults = getMissingContentDefaults(result);
    if (missingDefaults.length > 0) {
      await prisma.$transaction(
        missingDefaults.map(([key, value]) =>
          prisma.siteContent.upsert({
            where: { key },
            update: {},
            create: { key, value },
          })
        )
      );
    }

    return NextResponse.json(withContentDefaults(result));
  } catch (error) {
    console.error('Error fetching CMS content:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const entries = Object.entries(body);
    
    for (const [key, value] of entries) {
      await prisma.siteContent.upsert({
        where: { key },
        update: { value: String(value ?? '') },
        create: { key, value: String(value ?? '') },
      });
    }

    return NextResponse.json({ success: true, count: entries.length });
  } catch (error) {
    console.error('Error updating CMS content:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
