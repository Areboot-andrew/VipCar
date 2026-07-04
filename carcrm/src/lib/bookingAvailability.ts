import { prisma } from './prisma';

function occupiedStart(booking: { carDispatchAt: Date | null; dateStart: Date }) {
  return booking.carDispatchAt || booking.dateStart;
}

function occupiedEnd(booking: { returnToBaseAt: Date | null; dateEnd: Date }) {
  return booking.returnToBaseAt || booking.dateEnd;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export async function isCarAvailableForInterval(carId: string, start: Date, end: Date, ignoreBookingId?: string) {
  if (!carId || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return false;
  }

  const candidates = await prisma.booking.findMany({
    where: {
      carId,
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      status: { in: ['CONFIRMED', 'PENDING'] },
      OR: [
        { dateStart: { lte: end }, dateEnd: { gte: start } },
        { carDispatchAt: { lte: end }, dateEnd: { gte: start } },
        { dateStart: { lte: end }, returnToBaseAt: { gte: start } },
      ],
    },
    select: {
      id: true,
      dateStart: true,
      dateEnd: true,
      carDispatchAt: true,
      returnToBaseAt: true,
    },
  });

  return !candidates.some((booking) => overlaps(start, end, occupiedStart(booking), occupiedEnd(booking)));
}
