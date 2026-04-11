export function heatColor(score: number): string {
  if (score >= 80) return '#ff4500';
  if (score >= 60) return '#ff8c00';
  if (score >= 40) return '#ffcc00';
  return '#00d4ff';
}
