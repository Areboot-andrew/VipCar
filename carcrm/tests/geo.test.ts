import { describe, it, expect } from 'vitest';
import { coord, haversineRoadKm } from '../src/lib/geo';

describe('coord', () => {
  it('rejects null/undefined/empty so 0,0 is never a real point', () => {
    expect(coord(null, 30)).toBeNull();
    expect(coord(50, undefined)).toBeNull();
    expect(coord('', '')).toBeNull();
    expect(coord('abc', 10)).toBeNull();
  });

  it('parses numeric and string coordinates', () => {
    expect(coord(50, 30)).toEqual({ lat: 50, lng: 30 });
    expect(coord('49.84', '24.03')).toEqual({ lat: 49.84, lng: 24.03 });
  });
});

describe('haversineRoadKm', () => {
  it('returns 0 when a point is missing', () => {
    expect(haversineRoadKm(null, { lat: 50, lng: 30 })).toBe(0);
  });

  it('is 0 for the same point', () => {
    expect(haversineRoadKm({ lat: 50, lng: 30 }, { lat: 50, lng: 30 })).toBe(0);
  });

  it('gives a realistic road distance Kyiv -> Lviv (~460-620 km with road factor)', () => {
    const kyiv = { lat: 50.4501, lng: 30.5234 };
    const lviv = { lat: 49.8397, lng: 24.0297 };
    const d = haversineRoadKm(kyiv, lviv);
    expect(d).toBeGreaterThan(450);
    expect(d).toBeLessThan(650);
  });
});
