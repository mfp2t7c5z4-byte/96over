/**
 * Golf Tracker — Course Stats Sheet
 * Shows per-hole stats for a selected course + tee box:
 *   - Average score over last 5 rounds (vs par)
 *   - Best (lowest) score ever on that hole
 * Accessible from the History tab via "Course Stats" button.
 */
import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart2, TrendingDown, Star } from 'lucide-react';
import { getCourses, getRounds, type Course, type TeeBox } from '@/lib/storage';
import { getScoreLabel, getScoreColor } from '@/lib/handicap';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface HoleStat {
  holeNumber: number;
  par: number;
  yardage?: number;
  avgLast5: number | null;   // average of last 5 rounds (null if no data)
  best: number | null;        // lowest score ever (null if no data)
  roundCount: number;         // how many rounds have a score for this hole
}

function computeStats(course: Course, tee: TeeBox): HoleStat[] {
  // All completed rounds on this course + tee, newest first
  const rounds = getRounds()
    .filter(r => r.isComplete && r.courseId === course.id && r.teeBoxId === tee.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return tee.holes.map(hi => {
    // Scores for this hole across all rounds (exclude 0 = unplayed)
    const allScores = rounds
      .map(r => r.holes.find(h => h.holeNumber === hi.number)?.strokes ?? 0)
      .filter(s => s > 0);

    // Last 5 rounds' scores for avg
    const last5 = allScores.slice(0, 5);
    const avg = last5.length > 0
      ? last5.reduce((s, v) => s + v, 0) / last5.length
      : null;

    const best = allScores.length > 0 ? Math.min(...allScores) : null;

    return {
      holeNumber: hi.number,
      par: hi.par,
      yardage: hi.yardage,
      avgLast5: avg !== null ? Math.round(avg * 10) / 10 : null,
      best,
      roundCount: allScores.length,
    };
  });
}

function diffColor(score: number | null, par: number): string {
  if (score === null) return 'text-muted-foreground/40';
  const d = score - par;
  if (d < -1) return 'text-purple-600';
  if (d === -1) return 'text-emerald-600';
  if (d === 0) return 'text-muted-foreground';
  if (d === 1) return 'text-amber-600';
  return 'text-red-500';
}

function diffLabel(score: number | null, par: number): string {
  if (score === null) return '—';
  const d = score - par;
  if (d === 0) return 'E';
  return d > 0 ? `+${d}` : `${d}`;
}

export default function CourseStatsSheet({ open, onClose }: Props) {
  const courses = useMemo(() => getCourses(), []);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [teeBoxId, setTeeBoxId] = useState('');

  const selectedCourse = courses.find(c => c.id === courseId);
  const selectedTee = selectedCourse?.teeBoxes.find(t => t.id === teeBoxId)
    ?? selectedCourse?.teeBoxes[0];

  const stats = useMemo(() => {
    if (!selectedCourse || !selectedTee) return [];
    return computeStats(selectedCourse, selectedTee);
  }, [selectedCourse, selectedTee]);

  const totalRounds = selectedTee
    ? getRounds().filter(r => r.isComplete && r.courseId === courseId && r.teeBoxId === selectedTee.id).length
    : 0;

  // Front 9 / Back 9 split
  const front = stats.filter(s => s.holeNumber <= 9);
  const back = stats.filter(s => s.holeNumber >= 10);

  function renderHalfTable(holes: HoleStat[], label: string) {
    const totalAvg = holes.every(h => h.avgLast5 !== null)
      ? holes.reduce((s, h) => s + (h.avgLast5 ?? 0), 0)
      : null;
    const totalBest = holes.every(h => h.best !== null)
      ? holes.reduce((s, h) => s + (h.best ?? 0), 0)
      : null;
    const totalPar = holes.reduce((s, h) => s + h.par, 0);

    return (
      <div className="mb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">{label}</p>
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Header row */}
          <div className="grid bg-primary/5 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ gridTemplateColumns: '2rem 2rem 1fr 3rem 3rem' }}>
            <div className="px-2 py-2 text-center">H</div>
            <div className="px-1 py-2 text-center">Par</div>
            <div className="px-2 py-2">Yds</div>
            <div className="px-1 py-2 text-center flex items-center justify-center gap-0.5">
              <TrendingDown size={9} />Avg
            </div>
            <div className="px-1 py-2 text-center flex items-center justify-center gap-0.5">
              <Star size={9} />Best
            </div>
          </div>

          {/* Hole rows */}
          {holes.map(h => (
            <div
              key={h.holeNumber}
              className="grid border-b border-border/50 last:border-0 text-sm items-center"
              style={{ gridTemplateColumns: '2rem 2rem 1fr 3rem 3rem' }}
            >
              <div className="px-2 py-2.5 text-center">
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold inline-flex items-center justify-center">
                  {h.holeNumber}
                </span>
              </div>
              <div className="px-1 py-2.5 text-center text-xs text-muted-foreground font-medium">{h.par}</div>
              <div className="px-2 py-2.5 text-xs text-muted-foreground">{h.yardage ?? '—'}</div>
              {/* Avg last 5 */}
              <div className="px-1 py-2.5 text-center">
                {h.avgLast5 !== null ? (
                  <div>
                    <span className={`font-display font-bold text-sm ${diffColor(Math.round(h.avgLast5), h.par)}`}>
                      {h.avgLast5 % 1 === 0 ? h.avgLast5 : h.avgLast5.toFixed(1)}
                    </span>
                    <span className={`block text-[9px] font-semibold ${diffColor(Math.round(h.avgLast5), h.par)}`}>
                      {diffLabel(Math.round(h.avgLast5), h.par)}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/40 text-xs">—</span>
                )}
              </div>
              {/* Best */}
              <div className="px-1 py-2.5 text-center">
                {h.best !== null ? (
                  <div>
                    <span className={`font-display font-bold text-sm ${diffColor(h.best, h.par)}`}>
                      {h.best}
                    </span>
                    <span className={`block text-[9px] font-semibold ${diffColor(h.best, h.par)}`}>
                      {diffLabel(h.best, h.par)}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/40 text-xs">—</span>
                )}
              </div>
            </div>
          ))}

          {/* Totals row */}
          <div
            className="grid bg-muted/30 border-t border-border text-xs font-bold items-center"
            style={{ gridTemplateColumns: '2rem 2rem 1fr 3rem 3rem' }}
          >
            <div className="px-2 py-2 text-center text-muted-foreground col-span-2 text-[10px] uppercase tracking-wide">Out</div>
            <div className="px-2 py-2 text-muted-foreground">{totalPar}</div>
            <div className={`px-1 py-2 text-center font-display ${diffColor(totalAvg !== null ? Math.round(totalAvg) : null, totalPar)}`}>
              {totalAvg !== null ? (totalAvg % 1 === 0 ? totalAvg : totalAvg.toFixed(1)) : '—'}
            </div>
            <div className={`px-1 py-2 text-center font-display ${diffColor(totalBest, totalPar)}`}>
              {totalBest ?? '—'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto px-4 pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-xl flex items-center gap-2">
            <BarChart2 size={20} className="text-primary" />
            Course Stats
          </SheetTitle>
        </SheetHeader>

        {courses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">Add a course first to see stats.</p>
          </div>
        ) : (
          <>
            {/* Course selector */}
            <div className="space-y-3 mb-5">
              <Select value={courseId} onValueChange={v => { setCourseId(v); setTeeBoxId(''); }}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select course…" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCourse && selectedCourse.teeBoxes.length > 1 && (
                <Select value={selectedTee?.id ?? ''} onValueChange={setTeeBoxId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select tees…" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCourse.teeBoxes.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name} tees</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Summary pill */}
            <div className="flex items-center gap-3 mb-4 px-1">
              <div className="bg-primary/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary">
                {totalRounds} round{totalRounds !== 1 ? 's' : ''} recorded
              </div>
              <p className="text-xs text-muted-foreground">
                Avg = last 5 rounds · Best = all time
              </p>
            </div>

            {stats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No rounds recorded on this course yet.
              </div>
            ) : (
              <>
                {front.length > 0 && renderHalfTable(front, 'Front 9')}
                {back.length > 0 && renderHalfTable(back, 'Back 9')}
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
