/**
 * Golf Tracker — WHS Handicap Calculation Engine
 * Implements the World Handicap System (WHS) standard:
 * - Score Differential = (AGS - Course Rating) × (113 / Slope Rating)
 * - 9-hole: pair with expected 9-hole differential to form 18-hole equivalent
 * - Handicap Index = average of best 8 of last 20 differentials × 0.96
 */

import type { Round, HoleScore, TeeBox } from './storage';

// ─── Score Differential ──────────────────────────────────────────────────────

/**
 * Calculate an 18-hole Score Differential.
 * Formula: (AGS - Course Rating) × (113 / Slope Rating)
 */
export function calcScoreDifferential(
  adjustedGrossScore: number,
  courseRating: number,
  slopeRating: number,
): number {
  return ((adjustedGrossScore - courseRating) * 113) / slopeRating;
}

/**
 * Calculate a 9-hole Score Differential (half-round).
 * Uses the 9-hole course rating and slope rating.
 */
export function calc9HoleDifferential(
  adjustedGrossScore9: number,
  courseRating9: number,
  slopeRating9: number,
): number {
  return ((adjustedGrossScore9 - courseRating9) * 113) / slopeRating9;
}

/**
 * Combine two 9-hole differentials into a valid 18-hole equivalent.
 * WHS standard: add the two 9-hole differentials together.
 */
export function combine9HoleDifferentials(diff1: number, diff2: number): number {
  return diff1 + diff2;
}

/**
 * When only one 9-hole round is available, pair it with an expected
 * 9-hole differential. The expected differential is:
 *   - If handicap index exists: handicapIndex / 2
 *   - Otherwise: use 9-hole par equivalent (sum of par for 9 holes - 36/2 = 18 as baseline)
 *     WHS recommends using (handicapIndex / 2) or a course-par-based estimate.
 */
export function getExpected9HoleDiff(currentHandicapIndex: number | null): number {
  if (currentHandicapIndex !== null && currentHandicapIndex > 0) {
    return currentHandicapIndex / 2;
  }
  // No handicap yet — use 0 as the expected differential (scratch baseline)
  return 0;
}

/**
 * Compute the 18-hole equivalent differential for a 9-hole round.
 * Pairs the actual 9-hole differential with the expected 9-hole differential.
 */
export function compute9HoleEquivalentDiff(
  actual9HoleDiff: number,
  currentHandicapIndex: number | null,
): number {
  const expected = getExpected9HoleDiff(currentHandicapIndex);
  return actual9HoleDiff + expected;
}

// ─── Adjusted Gross Score (ESC) ──────────────────────────────────────────────

/**
 * Apply Equitable Stroke Control (ESC) to a hole score.
 * WHS uses a net double bogey limit per hole:
 *   Max score = par + 2 + any handicap strokes received on that hole
 * For simplicity (gross handicap not yet known), we cap at par + 5 as a
 * reasonable upper bound for amateur play (WHS allows net double bogey).
 * A more precise implementation would require course handicap.
 */
export function applyESC(strokes: number, par: number, courseHandicap?: number, handicapRank?: number): number {
  // Net double bogey = par + 2 + strokes received
  // Strokes received on a hole = floor(courseHandicap / 18) + (1 if handicapRank <= courseHandicap % 18)
  let maxScore = par + 5; // fallback cap
  if (courseHandicap !== undefined && handicapRank !== undefined) {
    const strokesReceived = Math.floor(courseHandicap / 18) + (handicapRank <= (courseHandicap % 18) ? 1 : 0);
    maxScore = par + 2 + strokesReceived;
  }
  return Math.min(strokes, maxScore);
}

/**
 * Calculate Adjusted Gross Score for a round.
 * Applies ESC to each hole and sums.
 */
export function calcAdjustedGrossScore(
  holes: HoleScore[],
  teeBox: TeeBox,
  courseHandicap?: number,
): number {
  return holes.reduce((total, hole) => {
    const holeInfo = teeBox.holes.find(h => h.number === hole.holeNumber);
    const par = holeInfo?.par ?? 4;
    const handicapRank = holeInfo?.handicapRank;
    const adjusted = applyESC(hole.strokes, par, courseHandicap, handicapRank);
    return total + adjusted;
  }, 0);
}

// ─── Course Handicap ─────────────────────────────────────────────────────────

/**
 * Calculate Course Handicap from Handicap Index.
 * Course Handicap = Handicap Index × (Slope Rating / 113) + (Course Rating - Par)
 */
export function calcCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number,
): number {
  return Math.round(handicapIndex * (slopeRating / 113) + (courseRating - par));
}

// ─── Handicap Index ───────────────────────────────────────────────────────────

/**
 * Calculate Handicap Index from a list of 18-hole equivalent differentials.
 * WHS rules:
 *   - Use the best 8 of the most recent 20 differentials
 *   - Multiply average by 0.96 (playing conditions factor)
 *   - Cap at 54.0
 *   - If fewer than 3 differentials: return null (not enough rounds)
 */
export function calcHandicapIndex(differentials: number[]): number | null {
  const recent = differentials.slice(-20);

  if (recent.length < 3) return null;

  // Sort ascending to find best (lowest) differentials
  const sorted = [...recent].sort((a, b) => a - b);

  let countToUse: number;
  if (recent.length <= 5) countToUse = 1;
  else if (recent.length <= 6) countToUse = 2;
  else if (recent.length <= 8) countToUse = 2;
  else if (recent.length <= 9) countToUse = 3;
  else if (recent.length <= 11) countToUse = 4;
  else if (recent.length <= 14) countToUse = 5;
  else if (recent.length <= 16) countToUse = 6;
  else if (recent.length <= 18) countToUse = 7;
  else countToUse = 8; // 19–20 rounds

  const best = sorted.slice(0, countToUse);
  const avg = best.reduce((s, d) => s + d, 0) / best.length;
  const index = Math.min(avg * 0.96, 54.0);

  return Math.round(index * 10) / 10; // round to 1 decimal
}

// ─── Score vs Par helpers ─────────────────────────────────────────────────────

export type ScoreLabel = 'condor' | 'albatross' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'triple+';

export function getScoreLabel(strokes: number, par: number): ScoreLabel {
  const diff = strokes - par;
  if (diff <= -4) return 'condor';
  if (diff === -3) return 'albatross';
  if (diff === -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'double';
  return 'triple+';
}

export function getScoreColor(label: ScoreLabel): string {
  switch (label) {
    case 'condor': return 'text-purple-700 bg-purple-100';
    case 'albatross': return 'text-purple-600 bg-purple-100';
    case 'eagle': return 'text-blue-600 bg-blue-100';
    case 'birdie': return 'text-emerald-700 bg-emerald-100';
    case 'par': return 'text-gray-600 bg-gray-100';
    case 'bogey': return 'text-amber-600 bg-amber-100';
    case 'double': return 'text-orange-600 bg-orange-100';
    case 'triple+': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getScoreBorderColor(label: ScoreLabel): string {
  switch (label) {
    case 'condor': return 'border-purple-500';
    case 'albatross': return 'border-purple-400';
    case 'eagle': return 'border-blue-400';
    case 'birdie': return 'border-emerald-400';
    case 'par': return 'border-gray-300';
    case 'bogey': return 'border-amber-400';
    case 'double': return 'border-orange-400';
    case 'triple+': return 'border-red-400';
    default: return 'border-gray-300';
  }
}

// ─── Smart hole fill ─────────────────────────────────────────────────────────

/**
 * For any hole in the current round that has 0 strokes,
 * fill it with the rounded average score from the last 5 completed rounds
 * on the same course + tee box for that specific hole number.
 * Falls back to par if no history exists.
 */
export function fillMissingHolesWithAverage(
  holes: import('./storage').HoleScore[],
  courseId: string,
  teeBoxId: string,
  teeBox: import('./storage').TeeBox,
): import('./storage').HoleScore[] {
  // getRounds is passed in to avoid a circular module dependency
  // (storage.ts does not import from handicap.ts)
  return holes; // placeholder — real impl uses the overload below
}

/**
 * Fill unplayed holes (strokes === 0) with the rounded average score
 * from the last 5 completed rounds on the same course + tee box.
 * Falls back to par when no history exists for a hole.
 *
 * @param getRoundsFn - pass getRounds from storage to avoid circular imports
 */
export function fillMissingHoles(
  holes: HoleScore[],
  courseId: string,
  teeBoxId: string,
  teeBox: TeeBox,
  getRoundsFn: () => Round[],
): HoleScore[] {
  // Get last 5 completed rounds on this course/tee
  const history = getRoundsFn()
    .filter((r: Round) => r.isComplete && r.courseId === courseId && r.teeBoxId === teeBoxId)
    .sort((a: Round, b: Round) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return holes.map((hole: HoleScore) => {
    if (hole.strokes > 0) return hole; // already has a score

    // Collect scores for this hole from history
    const historicScores: number[] = history
      .map((r: Round) => r.holes.find((h: HoleScore) => h.holeNumber === hole.holeNumber)?.strokes ?? 0)
      .filter((s: number) => s > 0);

    if (historicScores.length === 0) {
      const par = teeBox.holes.find(h => h.number === hole.holeNumber)?.par ?? 4;
      return { ...hole, strokes: par };
    }

    const avg = historicScores.reduce((s: number, v: number) => s + v, 0) / historicScores.length;
    return { ...hole, strokes: Math.round(avg) };
  });
}

// ─── Round stats helpers ──────────────────────────────────────────────────────

export function calcTotalStrokes(holes: HoleScore[]): number {
  return holes.reduce((s, h) => s + h.strokes, 0);
}

export function calcTotalPutts(holes: HoleScore[]): number {
  return holes.reduce((s, h) => s + h.putts, 0);
}

export function calcTotalPenalties(holes: HoleScore[]): number {
  return holes.reduce((s, h) => s + h.penalties, 0);
}

export function calcScoreVsPar(holes: HoleScore[], teeBox: TeeBox): number {
  const totalPar = holes.reduce((s, h) => {
    const holeInfo = teeBox.holes.find(hi => hi.number === h.holeNumber);
    return s + (holeInfo?.par ?? 4);
  }, 0);
  return calcTotalStrokes(holes) - totalPar;
}

export function formatScoreVsPar(diff: number): string {
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}
