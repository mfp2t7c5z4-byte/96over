/**
 * Golf Tracker — Local Storage Engine
 * Clubhouse Modern design: all data persisted locally, no server required.
 * Uses localStorage with JSON serialization. Supports export/import for backup.
 */

import { nanoid } from 'nanoid';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HoleInfo {
  number: number;       // 1–18
  par: number;          // 3, 4, or 5
  yardage: number;
  handicapRank: number; // 1–18 (stroke index)
}

export interface TeeBox {
  id: string;
  name: string;         // e.g. "White", "Blue", "Red"
  courseRating: number; // e.g. 71.2
  slopeRating: number;  // e.g. 125
  holes: HoleInfo[];    // 9 or 18 holes
}

export interface Course {
  id: string;
  name: string;
  city?: string;
  holeCount: 9 | 18;
  teeBoxes: TeeBox[];
  createdAt: string;
}

export interface HoleScore {
  holeNumber: number;
  strokes: number;
  putts: number;
  penalties: number;
}

export type RoundType = '18' | '9-front' | '9-back' | '9-standalone';

export interface Round {
  id: string;
  courseId: string;
  courseName: string;
  teeBoxId: string;
  teeBoxName: string;
  roundType: RoundType;
  date: string;          // ISO date string
  holes: HoleScore[];
  adjustedGrossScore?: number;
  scoreDifferential?: number;   // 18-hole equivalent differential
  nineHoleDifferential?: number; // raw 9-hole differential (before pairing)
  isComplete: boolean;
  notes?: string;
  playingPartners?: string;
  roundName?: string;
}

export interface HandicapRecord {
  handicapIndex: number;
  calculatedAt: string;
  differentialsUsed: number[];
  roundCount: number;
}

export interface AppData {
  courses: Course[];
  rounds: Round[];
  handicapHistory: HandicapRecord[];
  settings: {
    playerName: string;
    homeClub?: string;
  };
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const KEYS = {
  COURSES: 'gt_courses',
  ROUNDS: 'gt_rounds',
  HANDICAP_HISTORY: 'gt_handicap_history',
  SETTINGS: 'gt_settings',
  ACTIVE_ROUND: 'gt_active_round',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export function getCourses(): Course[] {
  return load<Course[]>(KEYS.COURSES, []);
}

export function saveCourse(course: Omit<Course, 'id' | 'createdAt'>): Course {
  const courses = getCourses();
  const newCourse: Course = {
    ...course,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  };
  courses.push(newCourse);
  save(KEYS.COURSES, courses);
  return newCourse;
}

export function updateCourse(id: string, updates: Partial<Omit<Course, 'id' | 'createdAt'>>): Course | null {
  const courses = getCourses();
  const idx = courses.findIndex(c => c.id === id);
  if (idx === -1) return null;
  courses[idx] = { ...courses[idx], ...updates };
  save(KEYS.COURSES, courses);
  return courses[idx];
}

export function deleteCourse(id: string): void {
  const courses = getCourses().filter(c => c.id !== id);
  save(KEYS.COURSES, courses);
}

export function getCourseById(id: string): Course | undefined {
  return getCourses().find(c => c.id === id);
}

// ─── Rounds ──────────────────────────────────────────────────────────────────

export function getRounds(): Round[] {
  return load<Round[]>(KEYS.ROUNDS, []);
}

export function saveRound(round: Round): void {
  const rounds = getRounds();
  const idx = rounds.findIndex(r => r.id === round.id);
  if (idx >= 0) {
    rounds[idx] = round;
  } else {
    rounds.push(round);
  }
  save(KEYS.ROUNDS, rounds);
}

export function deleteRound(id: string): void {
  const rounds = getRounds().filter(r => r.id !== id);
  save(KEYS.ROUNDS, rounds);
}

export function getRoundById(id: string): Round | undefined {
  return getRounds().find(r => r.id === id);
}

// ─── Active Round (in-progress) ──────────────────────────────────────────────

export function getActiveRound(): Round | null {
  return load<Round | null>(KEYS.ACTIVE_ROUND, null);
}

export function setActiveRound(round: Round | null): void {
  if (round === null) {
    localStorage.removeItem(KEYS.ACTIVE_ROUND);
  } else {
    save(KEYS.ACTIVE_ROUND, round);
  }
}

// ─── Handicap History ────────────────────────────────────────────────────────

export function getHandicapHistory(): HandicapRecord[] {
  return load<HandicapRecord[]>(KEYS.HANDICAP_HISTORY, []);
}

export function saveHandicapRecord(record: HandicapRecord): void {
  const history = getHandicapHistory();
  history.push(record);
  save(KEYS.HANDICAP_HISTORY, history);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function getSettings(): AppData['settings'] {
  return load<AppData['settings']>(KEYS.SETTINGS, { playerName: 'Golfer' });
}

export function saveSettings(settings: AppData['settings']): void {
  save(KEYS.SETTINGS, settings);
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export function exportData(): AppData {
  return {
    courses: getCourses(),
    rounds: getRounds(),
    handicapHistory: getHandicapHistory(),
    settings: getSettings(),
  };
}

export function importData(data: AppData): void {
  save(KEYS.COURSES, data.courses ?? []);
  save(KEYS.ROUNDS, data.rounds ?? []);
  save(KEYS.HANDICAP_HISTORY, data.handicapHistory ?? []);
  save(KEYS.SETTINGS, data.settings ?? { playerName: 'Golfer' });
}

// ─── ID Generator ────────────────────────────────────────────────────────────

export { nanoid };
