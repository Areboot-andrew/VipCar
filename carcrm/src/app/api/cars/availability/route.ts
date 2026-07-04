import { NextResponse } from 'next/server';
import { isCarAvailableForInterval } from '@/lib/bookingAvailability';

export async function POST(request: Request) {
  try {
    const { carId, dateStart, dateEnd, carDispatchAt, returnToBaseAt, checks } = await request.json();

    if (Array.isArray(checks)) {
      const results: Record<string, boolean> = {};
      await Promise.all(checks.map(async (check: { carId: string; dateStart: string; dateEnd: string; carDispatchAt?: string; returnToBaseAt?: string }) => {
        const start = new Date(check.carDispatchAt || check.dateStart);
        const end = new Date(check.returnToBaseAt || check.dateEnd);
        results[check.carId] = await isCarAvailableForInterval(check.carId, start, end);
      }));

      return NextResponse.json({ results });
    }

    const start = new Date(carDispatchAt || dateStart);
    const end = new Date(returnToBaseAt || dateEnd);

    return NextResponse.json({ available: await isCarAvailableForInterval(carId, start, end) });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}
