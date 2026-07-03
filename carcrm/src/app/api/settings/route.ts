import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const currencies = await prisma.currencyRate.findMany();
    const fuelPrices = await prisma.fuelPrice.findMany();
    return NextResponse.json({ currencies, fuelPrices });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.type === 'currency') {
      const { currency, rateToEur } = body;
      const result = await prisma.currencyRate.upsert({
        where: { currency },
        update: { rateToEur },
        create: { currency, rateToEur },
      });
      return NextResponse.json(result);
    }
    
    if (body.type === 'fuel') {
      const { country, fuelType, priceEur } = body;
      
      const existing = await prisma.fuelPrice.findFirst({
        where: { country, fuelType }
      });
      
      let result;
      if (existing) {
        result = await prisma.fuelPrice.update({
          where: { id: existing.id },
          data: { priceEur }
        });
      } else {
        result = await prisma.fuelPrice.create({
          data: { country, fuelType, priceEur }
        });
      }
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (type === 'currency') {
      await prisma.currencyRate.delete({ where: { id: id as string } });
    } else if (type === 'fuel') {
      await prisma.fuelPrice.delete({ where: { id: id as string } });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
