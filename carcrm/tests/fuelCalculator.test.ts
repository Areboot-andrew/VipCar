import { describe, it, expect } from 'vitest';
import { calculateSmartFuelCost } from '../src/lib/fuelCalculator';

const prices = [
  { country: 'Україна', fuelType: 'Бензин', priceEur: 1.4 },
  { country: 'Польща', fuelType: 'Бензин', priceEur: 1.6 },
];

describe('calculateSmartFuelCost', () => {
  it('returns zero for empty distance', () => {
    const r = calculateSmartFuelCost({
      totalDistance: 0,
      fuelConsumption: 8,
      fuelTankVolume: 60,
      fuelType: 'Бензин',
      routeCountries: ['Україна'],
      globalFuelPrices: prices,
    });
    expect(r.totalFuelCostEur).toBe(0);
    expect(r.totalLitersNeeded).toBe(0);
  });

  it('computes liters from consumption and distance', () => {
    const r = calculateSmartFuelCost({
      totalDistance: 500,
      fuelConsumption: 10, // L/100km -> 50 L
      fuelTankVolume: 60,
      fuelType: 'Бензин',
      routeCountries: ['Україна'],
      globalFuelPrices: prices,
    });
    expect(r.totalLitersNeeded).toBeCloseTo(50, 1);
    expect(r.totalFuelCostEur).toBeGreaterThan(0);
  });

  it('is cost-favorable: total cost never exceeds the most expensive country price', () => {
    const liters = 50;
    const r = calculateSmartFuelCost({
      totalDistance: 500,
      fuelConsumption: 10,
      fuelTankVolume: 60,
      fuelType: 'Бензин',
      routeCountries: ['Україна', 'Польща'],
      globalFuelPrices: prices,
    });
    expect(r.totalFuelCostEur).toBeLessThanOrEqual(liters * 1.6 + 0.01);
  });
});
