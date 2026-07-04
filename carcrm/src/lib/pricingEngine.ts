import { calculateSmartFuelCost, type FuelPrice } from './fuelCalculator';

type LatLng = { lat: number; lng: number } | null;

export type PricingSettings = {
  fuelPricePetrol?: number;
  fuelPriceDiesel?: number;
  amortizationRate?: number;
  marginRate?: number;
  deliveryRate?: number;
  deliveryBaseFee?: number;
  defaultCustomsWaitHours?: number;
  manualWaitingHours?: number;
  prepBufferMins?: number;
  trafficBufferPercent?: number;
  timeRatePerHour?: number;
  hotelAfterHours?: number;
  hotelCostPerNight?: number;
  minMarginPercent?: number;
  weekendCoeff?: number;
  forceWeekend?: boolean;
};

export type TripPricingInput = {
  car: any;
  distance: number;
  distanceCity: number;
  distanceHighway: number;
  durationMins: number;
  routeCountries: string[];
  origin: LatLng;
  returnToBaseDistance?: number;
  arrivalDate: Date | null;
  crossBorder: boolean;
  meetAndGreet: boolean;
  passengers: number;
  children: number;
  childSeats: number;
  petsCount: number;
  withDriver: boolean;
  discountPercent: number;
  globalFuelPrices: FuelPrice[];
  settings: PricingSettings;
};

export type TripPricingResult = {
  price: number;
  fuelCost: number;
  driverSalary: number;
  deliveryCost: number;
  deliveryDistance: number;
  deliveryDurationMins: number;
  amortization: number;
  timeCost: number;
  hotelCost: number;
  surcharges: number;
  netProfit: number;
  billableHours: number;
  customsWaitHours: number;
  manualWaitingHours: number;
  trafficBufferPercent: number;
  prepBufferMins: number;
  pickupAt: Date | null;
  carDispatchAt: Date | null;
  estimatedArrivalAt: Date | null;
  returnToBaseAt: Date | null;
  returnToBaseDistance: number;
  totalExpenseDistance: number;
  pricingSnapshot: Record<string, unknown>;
};

const roundMoney = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

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

const hasBorderCrossing = (routeCountries: string[]) => routeCountries.length > 1;

export function calculateTripPricing(input: TripPricingInput): TripPricingResult {
  const {
    car,
    distance,
    distanceCity,
    distanceHighway,
    durationMins,
    routeCountries,
    origin,
    returnToBaseDistance = 0,
    arrivalDate,
    crossBorder,
    meetAndGreet,
    passengers,
    children,
    childSeats,
    petsCount,
    withDriver,
    discountPercent,
    globalFuelPrices,
    settings,
  } = input;

  const baseLocation = car?.baseLat && car?.baseLng
    ? { lat: Number(car.baseLat), lng: Number(car.baseLng) }
    : null;

  const deliveryDistance = haversineRoadKm(baseLocation, origin);
  const deliveryDurationMins = deliveryDistance > 0 ? Math.ceil((deliveryDistance / 55) * 60) : 0;
  const returnDurationMins = returnToBaseDistance > 0 ? Math.ceil((returnToBaseDistance / 55) * 60) : 0;
  const trafficBufferPercent = settings.trafficBufferPercent ?? 10;
  const speedFactor = Math.max(0.5, 1 - trafficBufferPercent / 100);
  const adjustedRouteMins = Math.ceil(durationMins / speedFactor);
  const isBorderCrossing = hasBorderCrossing(routeCountries) || crossBorder;
  const customsWaitHours = isBorderCrossing ? (settings.defaultCustomsWaitHours ?? 1.5) : 0;
  const manualWaitingHours = settings.manualWaitingHours ?? 0;
  const prepBufferMins = settings.prepBufferMins ?? 30;
  const billableHours = roundMoney(((adjustedRouteMins + returnDurationMins) / 60) + customsWaitHours + manualWaitingHours);
  const pickupAt = arrivalDate
    ? new Date(arrivalDate.getTime() - (adjustedRouteMins + customsWaitHours * 60 + manualWaitingHours * 60) * 60000)
    : null;
  const carDispatchAt = pickupAt
    ? new Date(pickupAt.getTime() - (deliveryDurationMins + prepBufferMins) * 60000)
    : null;

  const avgConsumption = distance > 0
    ? ((distanceCity / distance) * Number(car?.fuelConsumptionCity || 0)) + ((distanceHighway / distance) * Number(car?.fuelConsumptionHighway || 0))
    : Number(car?.fuelConsumptionHighway || 8);

  const totalExpenseDistance = distance + deliveryDistance + returnToBaseDistance;

  const fuelCalc = calculateSmartFuelCost({
    totalDistance: totalExpenseDistance,
    fuelConsumption: avgConsumption || 8,
    fuelTankVolume: Number(car?.fuelTankVolume || 60),
    fuelType: car?.fuelType || 'Бензин',
    routeCountries,
    globalFuelPrices,
  });

  const fallbackFuelPrice = car?.fuelType === 'Дизель'
    ? (settings.fuelPriceDiesel ?? 1.5)
    : car?.fuelType === 'Електро'
      ? 0.48
      : (settings.fuelPricePetrol ?? 1.6);
  const fuelCost = fuelCalc.totalFuelCostEur > 0
    ? fuelCalc.totalFuelCostEur
    : (totalExpenseDistance / 100) * (avgConsumption || Number(car?.fuelConsumptionHighway || 8)) * fallbackFuelPrice;

  const driver = car?.defaultDriver;
  const driverKmRate = Number(driver?.salaryPerKm ?? 0.15);
  const driverHourRate = Number(driver?.salaryPerHour ?? settings.timeRatePerHour ?? 12);
  const driverSalary = withDriver ? (totalExpenseDistance * driverKmRate) + (billableHours * driverHourRate) : 0;
  const amortization = totalExpenseDistance * Number(car?.amortizationPerKm ?? settings.amortizationRate ?? 0.08);
  const deliveryCost = Number(car?.deliveryBaseFee ?? settings.deliveryBaseFee ?? 0) + deliveryDistance * Number(settings.deliveryRate ?? 1.1);
  const hotelAfterHours = settings.hotelAfterHours ?? 10;
  const hotelCost = billableHours > hotelAfterHours ? Number(driver?.overnightAllowance ?? settings.hotelCostPerNight ?? 90) : 0;

  const includedPassengers = Number(car?.includedPassengers ?? 1);
  const extraPassengers = Math.max(0, passengers - includedPassengers);
  const optionCost =
    (isBorderCrossing ? Number(car?.crossBorderFee || 0) : 0) +
    (meetAndGreet ? Number(car?.meetAndGreetFee || 0) : 0) +
    childSeats * Number(car?.childSeatFee || 0) +
    (petsCount > 0 ? petsCount * Number(car?.animalFee || 0) : 0) +
    extraPassengers * Number(car?.pricePerPerson || 0);

  const timeCost = billableHours * Number(settings.timeRatePerHour ?? 0);
  const routeBasePrice = distance * Number(car?.baseRate || 0);
  const internalCost = fuelCost + driverSalary + deliveryCost + amortization + hotelCost;
  const minMarginPrice = internalCost * (1 + Number(settings.minMarginPercent ?? settings.marginRate ?? 0.25));
  let clientPrice = Math.max(routeBasePrice + optionCost + timeCost + deliveryCost, minMarginPrice + optionCost);

  if ((arrivalDate && [0, 6].includes(arrivalDate.getDay())) || settings.forceWeekend) {
    clientPrice *= Number(settings.weekendCoeff ?? 1);
  }
  if (!withDriver) clientPrice *= 0.6;
  if (discountPercent > 0) clientPrice *= (1 - discountPercent / 100);

  const roundedPrice = Math.round(clientPrice);
  const surcharges = roundMoney(optionCost);
  const roundedInternal = roundMoney(internalCost);

  return {
    price: roundedPrice,
    fuelCost: roundMoney(fuelCost),
    driverSalary: roundMoney(driverSalary),
    deliveryCost: roundMoney(deliveryCost),
    deliveryDistance,
    deliveryDurationMins,
    amortization: roundMoney(amortization),
    timeCost: roundMoney(timeCost),
    hotelCost: roundMoney(hotelCost),
    surcharges,
    netProfit: roundMoney(roundedPrice - roundedInternal),
    billableHours,
    customsWaitHours,
    manualWaitingHours,
    trafficBufferPercent,
    prepBufferMins,
    pickupAt,
    carDispatchAt,
    estimatedArrivalAt: arrivalDate,
    returnToBaseAt: arrivalDate && returnDurationMins > 0 ? new Date(arrivalDate.getTime() + returnDurationMins * 60000) : null,
    returnToBaseDistance,
    totalExpenseDistance,
    pricingSnapshot: {
      routeBasePrice: roundMoney(routeBasePrice),
      internalCost: roundedInternal,
      minMarginPrice: roundMoney(minMarginPrice),
      fuelCalc,
      routeCountries,
      adjustedRouteMins,
      deliveryDurationMins,
      deliveryDistance,
      returnDurationMins,
      returnToBaseDistance,
      billableHours,
      customsWaitHours,
      manualWaitingHours,
      passengers,
      children,
      childSeats,
      petsCount,
      crossBorder: isBorderCrossing,
      meetAndGreet,
      withDriver,
      discountPercent,
    },
  };
}
