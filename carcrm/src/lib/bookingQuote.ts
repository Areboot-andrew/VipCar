import { calculateTripPricing } from './pricingEngine';
import { prisma } from './prisma';
import { resolveAutoEmptyLeg } from './emptyLegs';

type LatLng = { lat: number; lng: number } | null;

export type BookingQuoteInput = {
  carId: string;
  routeFrom?: string;
  routeTo?: string;
  routeCountries?: string[];
  distance: number | string;
  distanceCity?: number | string;
  distanceHighway?: number | string;
  durationMins?: number | string;
  originLat?: number | string | null;
  originLng?: number | string | null;
  destinationLat?: number | string | null;
  destinationLng?: number | string | null;
  arrivalDate?: string | Date | null;
  passengers?: number | string;
  children?: number | string;
  childSeats?: number | string;
  petsCount?: number | string;
  meetAndGreet?: boolean;
  withDriver?: boolean;
  promotionId?: string | null;
  promoCode?: string | null;
  discountPercent?: number | string;
  isEndingAtBase?: boolean;
};

const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const coord = (lat: unknown, lng: unknown): LatLng => {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  return { lat: parsedLat, lng: parsedLng };
};

const haversineRoadKm = (from: LatLng, to: LatLng) => {
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
};

const parseSettings = (rows: { key: string; value: string }[]) => {
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    deliveryRate: numberValue(map.pricing_delivery_rate, 1.1),
    deliveryBaseFee: numberValue(map.pricing_delivery_base_fee, 20),
    defaultCustomsWaitHours: numberValue(map.pricing_customs_wait_hours, 1.5),
    manualWaitingHours: numberValue(map.pricing_manual_waiting_hours, 0),
    prepBufferMins: numberValue(map.pricing_prep_buffer_mins, 30),
    trafficBufferPercent: numberValue(map.pricing_traffic_buffer_percent, 10),
    timeRatePerHour: numberValue(map.pricing_time_rate_per_hour, 0),
    hotelAfterHours: numberValue(map.pricing_hotel_after_hours, 10),
    hotelCostPerNight: numberValue(map.pricing_hotel_cost_per_night, 90),
    minMarginPercent: numberValue(map.pricing_min_margin_percent, 0.25),
    weekendCoeff: numberValue(map.weekend_coefficient, 1.2),
  };
};

const textMatches = (needle: string | null | undefined, haystack: string | null | undefined) => {
  if (!needle) return true;
  if (!haystack) return false;
  return haystack.toLocaleLowerCase('uk').includes(needle.toLocaleLowerCase('uk'));
};

async function resolveDiscount(input: BookingQuoteInput) {
  let promotion = null as Awaited<ReturnType<typeof prisma.promotion.findFirst>> | null;

  if (input.promotionId) {
    promotion = await prisma.promotion.findFirst({
      where: { id: input.promotionId, active: true },
    });
  }

  if (promotion) {
    const carOk = !promotion.carId || promotion.carId === input.carId;
    const routeOk = textMatches(promotion.routeFrom, input.routeFrom) && textMatches(promotion.routeTo, input.routeTo);
    return {
      promotion: carOk && routeOk ? promotion : null,
      percent: carOk && routeOk ? Number(promotion.discount || 0) : 0,
      promoCode: input.promoCode || null,
    };
  }

  const autoEmptyLeg = await resolveAutoEmptyLeg(input.promoCode, input.carId, input.routeFrom, input.routeTo, coord(input.originLat, input.originLng));
  if (autoEmptyLeg) {
    return {
      promotion: null,
      percent: Number(autoEmptyLeg.discount || 0),
      promoCode: autoEmptyLeg.id,
    };
  }

  const code = String(input.promoCode || '').trim().toLowerCase();
  if (code === 'vip10') {
    return { promotion: null, percent: 10, promoCode: 'vip10' };
  }

  return {
    promotion: null,
    percent: 0,
    promoCode: input.promoCode || null,
  };
}

export async function calculateBookingQuote(input: BookingQuoteInput) {
  const car = await prisma.car.findUnique({
    where: { id: input.carId },
    include: { defaultDriver: { include: { user: true } } },
  });

  if (!car) {
    throw new Error('Car not found');
  }

  const [siteSettings, contentRows, globalFuelPrices] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'global' } }),
    prisma.siteContent.findMany({
      where: {
        key: {
          in: [
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
            'weekend_coefficient',
          ],
        },
      },
    }),
    prisma.fuelPrice.findMany(),
  ]);

  const origin = coord(input.originLat, input.originLng);
  const destination = coord(input.destinationLat, input.destinationLng);
  const baseLocation = coord(car.baseLat, car.baseLng);
  const isEndingAtBase = Boolean(input.isEndingAtBase);
  const returnToBaseDistance = isEndingAtBase ? haversineRoadKm(destination, baseLocation) : 0;
  const distance = Math.max(0, numberValue(input.distance, 0));
  const distanceCity = numberValue(input.distanceCity, Math.ceil(distance * 0.3));
  const distanceHighway = numberValue(input.distanceHighway, Math.ceil(distance * 0.7));
  const discount = await resolveDiscount(input);

  const settings = {
    ...parseSettings(contentRows),
    fuelPricePetrol: siteSettings?.fuelPricePetrol ?? 1.6,
    fuelPriceDiesel: siteSettings?.fuelPriceDiesel ?? 1.5,
  };

  const basePricing = calculateTripPricing({
    car,
    distance,
    distanceCity,
    distanceHighway,
    durationMins: numberValue(input.durationMins, 0),
    routeCountries: Array.isArray(input.routeCountries) ? input.routeCountries : [],
    origin,
    returnToBaseDistance,
    arrivalDate: input.arrivalDate ? new Date(input.arrivalDate) : null,
    crossBorder: Array.isArray(input.routeCountries) && input.routeCountries.length > 1,
    meetAndGreet: Boolean(input.meetAndGreet),
    passengers: numberValue(input.passengers, 1),
    children: numberValue(input.children, 0),
    childSeats: numberValue(input.childSeats, 0),
    petsCount: numberValue(input.petsCount, 0),
    withDriver: input.withDriver !== false,
    discountPercent: 0,
    globalFuelPrices,
    settings,
  });

  const pricing = calculateTripPricing({
    car,
    distance,
    distanceCity,
    distanceHighway,
    durationMins: numberValue(input.durationMins, 0),
    routeCountries: Array.isArray(input.routeCountries) ? input.routeCountries : [],
    origin,
    returnToBaseDistance,
    arrivalDate: input.arrivalDate ? new Date(input.arrivalDate) : null,
    crossBorder: Array.isArray(input.routeCountries) && input.routeCountries.length > 1,
    meetAndGreet: Boolean(input.meetAndGreet),
    passengers: numberValue(input.passengers, 1),
    children: numberValue(input.children, 0),
    childSeats: numberValue(input.childSeats, 0),
    petsCount: numberValue(input.petsCount, 0),
    withDriver: input.withDriver !== false,
    discountPercent: discount.percent,
    globalFuelPrices,
    settings,
  });

  return {
    car,
    pricing,
    promotion: discount.promotion,
    promoCode: discount.promoCode,
    discountPercent: discount.percent,
    discountAmount: Math.max(0, basePricing.price - pricing.price),
    origin,
    destination,
    isEndingAtBase,
  };
}
