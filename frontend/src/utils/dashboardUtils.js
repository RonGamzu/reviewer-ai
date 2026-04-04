export function calcXp(scoredInterviews) {
  return scoredInterviews.reduce((s, i) => s + i.ai_score * 15, 0);
}

export function calcLevel(xp) {
  if (xp === 0) return 1;
  return Math.max(1, Math.floor(Math.log(Math.max(xp, 101) / 100) / Math.log(1.5)));
}

export function calcAvgScore(scoredInterviews) {
  if (scoredInterviews.length === 0) return 0;
  return Math.round(scoredInterviews.reduce((s, i) => s + i.ai_score, 0) / scoredInterviews.length);
}

export function calcBestScore(scoredInterviews) {
  if (scoredInterviews.length === 0) return 0;
  return Math.max(...scoredInterviews.map(i => i.ai_score));
}
