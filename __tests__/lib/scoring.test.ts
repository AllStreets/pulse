import { scorePrediction, getHourBucket, getBoldnessMultiplier } from '@/lib/scoring';

describe('getHourBucket', () => {
  it('maps midnight to bucket 0', () => {
    expect(getHourBucket(0)).toBe(0);
  });
  it('maps 1am to bucket 0', () => {
    expect(getHourBucket(1)).toBe(0);
  });
  it('maps 2am to bucket 1', () => {
    expect(getHourBucket(2)).toBe(1);
  });
  it('maps 10pm to bucket 11', () => {
    expect(getHourBucket(22)).toBe(11);
  });
  it('maps 11pm to bucket 11', () => {
    expect(getHourBucket(23)).toBe(11);
  });
});

describe('getBoldnessMultiplier', () => {
  it('returns 2.0 when heat at call time is below p75', () => {
    expect(getBoldnessMultiplier(30, 75)).toBe(2.0);
  });
  it('returns 0.5 when heat at call time is at or above p75', () => {
    expect(getBoldnessMultiplier(75, 75)).toBe(0.5);
    expect(getBoldnessMultiplier(90, 75)).toBe(0.5);
  });
});

describe('scorePrediction', () => {
  const base = {
    venueHistoricalAvg: 50,
    venueP75Heat: 75,
  };

  it('marks correct and awards 2x points for early call', () => {
    const result = scorePrediction({
      ...base,
      heatAtCallTime: 30,
      finalHeatScore: 80,
    });
    expect(result.outcome).toBe('correct');
    expect(result.boldnessScore).toBe(2.0);
    expect(result.pointsAwarded).toBe(200);
  });

  it('marks correct and awards 0.5x points for late call', () => {
    const result = scorePrediction({
      ...base,
      heatAtCallTime: 80,
      finalHeatScore: 90,
    });
    expect(result.outcome).toBe('correct');
    expect(result.boldnessScore).toBe(0.5);
    expect(result.pointsAwarded).toBe(50);
  });

  it('marks incorrect and awards 0 points when final heat is below avg', () => {
    const result = scorePrediction({
      ...base,
      heatAtCallTime: 30,
      finalHeatScore: 40,
    });
    expect(result.outcome).toBe('incorrect');
    expect(result.boldnessScore).toBe(0);
    expect(result.pointsAwarded).toBe(0);
  });

  it('marks incorrect when final heat exactly equals historical average', () => {
    const result = scorePrediction({
      ...base,
      heatAtCallTime: 30,
      finalHeatScore: 50, // exactly equals venueHistoricalAvg
    });
    expect(result.outcome).toBe('incorrect');
    expect(result.pointsAwarded).toBe(0);
  });
});
