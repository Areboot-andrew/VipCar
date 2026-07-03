import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONTENT_SETTING_KEYS = [
  'brand_name',
  'contact_phone',
  'contact_email',
  'payment_card',
  'payment_usdt',
  'telegram_enabled',
  'telegram_api_id',
  'telegram_api_hash',
  'telegram_string_session',
  'facebook_enabled',
  'facebook_page_token',
  'facebook_verify_token',
  'whatsapp_enabled',
  'whatsapp_phone_number_id',
  'whatsapp_business_account_id',
  'whatsapp_access_token',
  'whatsapp_verify_token',
  'pricing_delivery_rate',
  'pricing_delivery_base_fee',
  'pricing_customs_wait_hours',
  'pricing_manual_waiting_hours',
  'pricing_prep_buffer_mins',
  'pricing_traffic_buffer_percent',
  'pricing_time_rate_per_hour',
  'pricing_hotel_after_hours',
  'pricing_hotel_cost_per_night',
  'pricing_min_margin_percent',
];

export async function GET() {
  try {
    const currencies = await prisma.currencyRate.findMany();
    const fuelPrices = await prisma.fuelPrice.findMany();
    const contentRows = await prisma.siteContent.findMany({
      where: { key: { in: CONTENT_SETTING_KEYS } },
    });

    const contentSettings = contentRows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ currencies, fuelPrices, contentSettings });
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

    if (body.type === 'contentSettings') {
      const settings = body.settings as Record<string, string>;
      const entries = Object.entries(settings || {}).filter(([key]) => CONTENT_SETTING_KEYS.includes(key));

      await prisma.$transaction(
        entries.map(([key, value]) =>
          prisma.siteContent.upsert({
            where: { key },
            update: { value: value ?? '' },
            create: { key, value: value ?? '' },
          })
        )
      );

      return NextResponse.json({ success: true });
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
