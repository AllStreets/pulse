// Hour bucket: maps a 24-hour clock hour to a 2-hour bucket index.
// Bucket 0 = 12am-2am, Bucket 1 = 2am-4am, ... Bucket 11 = 10pm-12am
export function getHourBucket(hour: number): number {
  return Math.floor(hour / 2);
}

// Boldness multiplier based on whether the call was early (before p75 threshold)
export function getBoldnessMultiplier(heatAtCallTime: number, p75Heat: number): number {
  return heatAtCallTime < p75Heat ? 2.0 : 0.5;
}

export interface ScoringInput {
  heatAtCallTime: number;
  finalHeatScore: number;
  venueHistoricalAvg: number;
  venueP75Heat: number;
}

export interface ScoringResult {
  outcome: 'correct' | 'incorrect';
  boldnessScore: number;
  pointsAwarded: number;
}

const BASE_POINTS = 100;

export function scorePrediction(input: ScoringInput): ScoringResult {
  const { heatAtCallTime, finalHeatScore, venueHistoricalAvg, venueP75Heat } = input;

  if (finalHeatScore <= venueHistoricalAvg) {
    return { outcome: 'incorrect', boldnessScore: 0, pointsAwarded: 0 };
  }

  const boldnessScore = getBoldnessMultiplier(heatAtCallTime, venueP75Heat);
  const pointsAwarded = Math.round(BASE_POINTS * boldnessScore);

  return { outcome: 'correct', boldnessScore, pointsAwarded };
}
