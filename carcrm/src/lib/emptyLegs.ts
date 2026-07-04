import { prisma } from './prisma';
import { isCarAvailableForInterval } from './bookingAvailability';

const AUTO_EMPTY_PREFIX = 'auto-empty-';
const AUTO_EMPTY_WINDOW_DAYS = 7;
const AUTO_EMPTY_PICKUP_RADIUS_KM = 50;

type LatLng = { lat: number; lng: number } | null;

function coord(lat?: number | null, lng?: number | null): LatLng {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

function haversineRoadKm(from: LatLng, to: LatLng) {
  if (!from || !to) return 0;
  const radius = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.ceil(radius * c * 1.3);
}

function shortPlace(value?: string | null) {
  return (value || '').split(',')[0].trim();
}

export function autoEmptyDiscount(dateStart: Date, now = new Date()) {
  const hoursToStart = (dateStart.getTime() - now.getTime()) / 36e5;
  if (hoursToStart <= 24) return 50;
  if (hoursToStart <= 72) return 40;
  return 30;
}

function returnWindow(booking: {
  dateEnd: Date;
  destinationLat: number | null;
  destinationLng: number | null;
  returnToBaseDistance: number | null;
  distance: number;
  car: { baseLat: number | null; baseLng: number | null };
}) {
  const destination = coord(booking.destinationLat, booking.destinationLng);
  const base = coord(booking.car.baseLat, booking.car.baseLng);
  const distanceKm = booking.returnToBaseDistance || haversineRoadKm(destination, base) || Math.ceil(Number(booking.distance || 300) * 0.75);
  const minutes = Math.max(60, Math.ceil((distanceKm / 55) * 60));
  const start = booking.dateEnd;
  return {
    distanceKm,
    start,
    end: new Date(start.getTime() + minutes * 60000),
  };
}

export async function getAutoEmptyLegPromotions(now = new Date()) {
  const windowEnd = new Date(now.getTime() + AUTO_EMPTY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      isEndingAtBase: false,
      dateEnd: { gte: now, lte: windowEnd },
      car: {
        baseCity: { not: null },
      },
    },
    include: {
      car: {
        include: {
          media: { where: { active: true }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
        },
      },
    },
    orderBy: { dateEnd: 'asc' },
  });

  const promos = [];

  for (const booking of bookings) {
    const baseCity = shortPlace(booking.car.baseCity);
    const fromCity = shortPlace(booking.routeTo);
    if (!baseCity || !fromCity || fromCity.toLocaleLowerCase('uk') === baseCity.toLocaleLowerCase('uk')) continue;

    const window = returnWindow(booking);
    const available = await isCarAvailableForInterval(booking.carId, window.start, window.end, booking.id);
    if (!available) continue;
    const discount = autoEmptyDiscount(window.start, now);
    const originalPrice = Math.max(0, Math.round(window.distanceKm * Number(booking.car.baseRate || 0)));
    const discountedPrice = Math.max(0, Math.round(originalPrice * (1 - discount / 100)));

    promos.push({
      id: `${AUTO_EMPTY_PREFIX}${booking.id}`,
      title: `${fromCity} та околиці -> ${baseCity}`,
      routeFrom: fromCity,
      routeTo: baseCity,
      discount,
      originalPrice,
      discountedPrice,
      dateStart: window.start,
      active: true,
      carId: booking.carId,
      car: booking.car,
      source: 'AUTO_EMPTY',
      bookingId: booking.id,
      distanceKm: window.distanceKm,
      pickupRadiusKm: AUTO_EMPTY_PICKUP_RADIUS_KM,
      pickupCenterLat: booking.destinationLat,
      pickupCenterLng: booking.destinationLng,
      pickupZoneText: `Заберемо у ${fromCity} та до ${AUTO_EMPTY_PICKUP_RADIUS_KM} км навколо`,
    });
  }

  return promos;
}

export async function resolveAutoEmptyLeg(
  code?: string | null,
  carId?: string,
  routeFrom?: string,
  routeTo?: string,
  origin?: LatLng
) {
  if (!code?.startsWith(AUTO_EMPTY_PREFIX)) return null;
  const bookingId = code.slice(AUTO_EMPTY_PREFIX.length);
  const promos = await getAutoEmptyLegPromotions();
  const promo = promos.find((item) => item.bookingId === bookingId && item.carId === carId);
  if (!promo) return null;

  const center = coord(promo.pickupCenterLat, promo.pickupCenterLng);
  const distanceToPickupZone = haversineRoadKm(origin || null, center);
  const fromTextOk = !routeFrom || routeFrom.toLocaleLowerCase('uk').includes(String(promo.routeFrom).toLocaleLowerCase('uk'));
  const fromGeoOk = Boolean(origin && center && distanceToPickupZone <= AUTO_EMPTY_PICKUP_RADIUS_KM);
  const fromOk = fromTextOk || fromGeoOk;
  const toOk = !routeTo || routeTo.toLocaleLowerCase('uk').includes(String(promo.routeTo).toLocaleLowerCase('uk'));
  if (!fromOk || !toOk) return null;

  return promo;
}
