import { heatColor } from '@/lib/heatColor';

describe('heatColor', () => {
  it('returns #ff4500 for score 80', () => {
    expect(heatColor(80)).toBe('#ff4500');
  });
  it('returns #ff4500 for score 100', () => {
    expect(heatColor(100)).toBe('#ff4500');
  });
  it('returns #ff8c00 for score 60', () => {
    expect(heatColor(60)).toBe('#ff8c00');
  });
  it('returns #ff8c00 for score 79', () => {
    expect(heatColor(79)).toBe('#ff8c00');
  });
  it('returns #ffcc00 for score 40', () => {
    expect(heatColor(40)).toBe('#ffcc00');
  });
  it('returns #ffcc00 for score 59', () => {
    expect(heatColor(59)).toBe('#ffcc00');
  });
  it('returns #00d4ff for score 39', () => {
    expect(heatColor(39)).toBe('#00d4ff');
  });
  it('returns #00d4ff for score 0', () => {
    expect(heatColor(0)).toBe('#00d4ff');
  });
});
