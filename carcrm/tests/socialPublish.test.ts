import { describe, it, expect } from 'vitest';
import { fillTemplate, isQuietHours, slotIsDue, toMinutes } from '../src/lib/socialPublish';

describe('fillTemplate', () => {
  it('replaces known placeholders and blanks unknown ones', () => {
    const out = fillTemplate('{carName} за {price} — {url}', { carName: 'BMW 7', url: 'https://x.io' });
    expect(out).toBe('BMW 7 за  — https://x.io');
  });
});

describe('toMinutes', () => {
  it('converts HH:MM to minutes', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('10:30')).toBe(630);
    expect(toMinutes('22:00')).toBe(1320);
  });
});

describe('isQuietHours (overnight window 22:00-08:00)', () => {
  const start = '22:00';
  const end = '08:00';
  it('is quiet late at night and early morning', () => {
    expect(isQuietHours(toMinutes('23:30'), start, end)).toBe(true);
    expect(isQuietHours(toMinutes('03:00'), start, end)).toBe(true);
    expect(isQuietHours(toMinutes('07:59'), start, end)).toBe(true);
  });
  it('is not quiet during the day', () => {
    expect(isQuietHours(toMinutes('10:00'), start, end)).toBe(false);
    expect(isQuietHours(toMinutes('21:59'), start, end)).toBe(false);
    expect(isQuietHours(toMinutes('08:00'), start, end)).toBe(false);
  });
  it('handles a same-day window 13:00-14:00', () => {
    expect(isQuietHours(toMinutes('13:30'), '13:00', '14:00')).toBe(true);
    expect(isQuietHours(toMinutes('12:00'), '13:00', '14:00')).toBe(false);
  });
});

describe('slotIsDue', () => {
  const win = 20;
  it('is due within the window after the slot', () => {
    expect(slotIsDue(toMinutes('10:30'), '10:30', win)).toBe(true);
    expect(slotIsDue(toMinutes('10:45'), '10:30', win)).toBe(true); // 15 < 20
  });
  it('is not due before the slot or after the window', () => {
    expect(slotIsDue(toMinutes('10:29'), '10:30', win)).toBe(false);
    expect(slotIsDue(toMinutes('10:50'), '10:30', win)).toBe(false); // exactly window end excluded
    expect(slotIsDue(toMinutes('12:00'), '10:30', win)).toBe(false);
  });
});
