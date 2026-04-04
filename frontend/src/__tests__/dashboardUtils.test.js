import { calcXp, calcLevel, calcAvgScore, calcBestScore } from '../utils/dashboardUtils';

describe('calcXp', () => {
  test('returns 0 for empty array', () => {
    expect(calcXp([])).toBe(0);
  });

  test('multiplies ai_score by 15', () => {
    expect(calcXp([{ ai_score: 80 }])).toBe(1200);
  });

  test('sums across multiple interviews', () => {
    expect(calcXp([{ ai_score: 80 }, { ai_score: 60 }])).toBe(2100);
  });

  test('handles score of 0', () => {
    expect(calcXp([{ ai_score: 0 }])).toBe(0);
  });

  test('handles score of 100', () => {
    expect(calcXp([{ ai_score: 100 }])).toBe(1500);
  });
});

describe('calcLevel', () => {
  test('returns 1 for 0 xp', () => {
    expect(calcLevel(0)).toBe(1);
  });

  test('returns 1 for low xp', () => {
    expect(calcLevel(100)).toBe(1);
  });

  test('returns higher levels for more xp', () => {
    expect(calcLevel(10000)).toBeGreaterThan(calcLevel(1000));
  });

  test('returns at least 1', () => {
    expect(calcLevel(50)).toBeGreaterThanOrEqual(1);
  });
});

describe('calcAvgScore', () => {
  test('returns 0 for empty array', () => {
    expect(calcAvgScore([])).toBe(0);
  });

  test('returns exact score for single interview', () => {
    expect(calcAvgScore([{ ai_score: 75 }])).toBe(75);
  });

  test('returns average of multiple scores', () => {
    expect(calcAvgScore([{ ai_score: 80 }, { ai_score: 60 }])).toBe(70);
  });

  test('rounds to nearest integer', () => {
    expect(calcAvgScore([{ ai_score: 70 }, { ai_score: 71 }])).toBe(71);
  });
});

describe('calcBestScore', () => {
  test('returns 0 for empty array', () => {
    expect(calcBestScore([])).toBe(0);
  });

  test('returns the single score', () => {
    expect(calcBestScore([{ ai_score: 65 }])).toBe(65);
  });

  test('returns the highest score', () => {
    expect(calcBestScore([{ ai_score: 70 }, { ai_score: 95 }, { ai_score: 55 }])).toBe(95);
  });
});
