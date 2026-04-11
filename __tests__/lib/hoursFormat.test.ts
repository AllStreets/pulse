import { todayHoursString } from '@/lib/hours';

const HOURS: Record<string, string> = {
  mon: 'closed',
  tue: 'closed',
  wed: '20:00-02:00',
  thu: '20:00-03:00',
  fri: '20:00-04:00',
  sat: '20:00-04:00',
  sun: '18:00-00:00',
};

describe('todayHoursString', () => {
  it('returns null for null input', () => {
    expect(todayHoursString(null)).toBeNull();
  });

  it('returns "Closed tonight" for a closed day', () => {
    // Mock Date to Monday
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-13T20:00:00')); // Monday
    expect(todayHoursString(HOURS)).toBe('Closed tonight');
    jest.useRealTimers();
  });

  it('formats a normal range for Friday', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-10T20:00:00')); // Friday
    expect(todayHoursString(HOURS)).toBe('8PM – 4AM');
    jest.useRealTimers();
  });

  it('formats a Sunday early close', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-12T20:00:00')); // Sunday
    expect(todayHoursString(HOURS)).toBe('6PM – 12AM');
    jest.useRealTimers();
  });
});
