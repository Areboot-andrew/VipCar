import { describe, it, expect } from 'vitest';
import { calculateTripPricing } from '../src/lib/pricingEngine';

const car = {
  baseRate: 3,
  baseLat: 50.4501,
  baseLng: 30.5234,
  fuelType: 'Бензин',
  fuelConsumptionCity: 12,
  fuelConsumptionHighway: 8,
  fuelTankVolume: 70,
  amortizationPerKm: 0.08,
  meetAndGreetFee: 20,
  childSeatFee: 15,
  animalFee: 30,
  crossBorderFee: 150,
  includedPassengers: 1,
  pricePerPerson: 10,
};

const baseInput = {
  car,
  distance: 300,
  distanceCity: 90,
  distanceHighway: 210,
  durationMins: 240,
  routeCountries: ['Україна'],
  origin: { lat: 50.4501, lng: 30.5234 },
  arrivalDate: new Date('2026-07-08T12:00:00'), // Wednesday
  crossBorder: false,
  meetAndGreet: false,
  passengers: 1,
  children: 0,
  childSeats: 0,
  petsCount: 0,
  withDriver: true,
  discountPercent: 0,
  globalFuelPrices: [],
  settings: { weekendCoeff: 1.2, minMarginPercent: 0.25 },
};

describe('calculateTripPricing', () => {
  it('price covers at least route base (distance * baseRate)', () => {
    const r = calculateTripPricing(baseInput);
    expect(r.price).toBeGreaterThanOrEqual(300 * 3 * 0.99);
    expect(r.netProfit).toBeGreaterThan(0);
  });

  it('applies discount to the final price', () => {
    const full = calculateTripPricing(baseInput).price;
    const discounted = calculateTripPricing({ ...baseInput, discountPercent: 20 }).price;
    expect(discounted).toBeLessThan(full);
    expect(discounted).toBeCloseTo(full * 0.8, -1);
  });

  it('weekend coefficient raises the price', () => {
    const weekday = calculateTripPricing(baseInput).price;
    const weekend = calculateTripPricing({
      ...baseInput,
      arrivalDate: new Date('2026-07-11T12:00:00'), // Saturday
    }).price;
    expect(weekend).toBeGreaterThan(weekday);
  });

  it('cross-border trip adds customs hours and the border fee', () => {
    const domestic = calculateTripPricing(baseInput);
    const crossing = calculateTripPricing({
      ...baseInput,
      routeCountries: ['Україна', 'Польща'],
      crossBorder: true,
    });
    expect(crossing.customsWaitHours).toBeGreaterThan(0);
    expect(crossing.price).toBeGreaterThan(domestic.price);
  });

  it('paid options (child seat, pets, meet&greet) increase the price', () => {
    const withOptions = calculateTripPricing({
      ...baseInput,
      childSeats: 2,
      petsCount: 1,
      meetAndGreet: true,
    });
    const base = calculateTripPricing(baseInput);
    expect(withOptions.surcharges).toBeGreaterThan(0);
    expect(withOptions.price).toBeGreaterThan(base.price);
  });

  it('computes pickup time before arrival', () => {
    const r = calculateTripPricing(baseInput);
    expect(r.pickupAt).toBeInstanceOf(Date);
    expect(r.pickupAt!.getTime()).toBeLessThan(baseInput.arrivalDate.getTime());
  });
});
