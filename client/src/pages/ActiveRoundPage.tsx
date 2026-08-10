/**
 * Golf Tracker — Active Round Page
 * Clubhouse Modern: large shot counter, putt + penalty counters,
 * hole navigation, live scorecard summary.
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import AppShell from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flag, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  getActiveRound, setActiveRound, saveRound, getCourseById,
  type Round, type HoleScore,
} from '@/lib/storage';
import {
  calcAdjustedGrossScore, calcScoreDifferential, calc9HoleDifferential,
  compute9HoleEquivalentDiff, calcHandicapIndex, getScoreLabel, getScoreColor,
  calcTotalStrokes, formatScoreVsPar, calcScoreVsPar,
} from '@/lib/handicap';
import { fillMissingHoles } from '@/lib/handicap';
import { getRounds as loadRounds } from '@/lib/storage';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ─── Per-hole stats helper ────────────────────────────────────────────────────
function getHoleStats(courseId: string, teeBoxId: string, holeNumber: number) {
  const rounds = loadRounds()
    .filter(r => r.isComplete && r.courseId === courseId && r.teeBoxId === teeBoxId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allScores = rounds
    .map(r => r.holes.find(h => h.holeNumber === holeNumber)?.strokes ?? 0)
    .filter(s => s > 0);

  const last5 = allScores.slice(0, 5);
  const avg = last5.length > 0 ? last5.reduce((s, v) => s + v, 0) / last5.length : null;
  const best = allScores.length > 0 ? Math.min(...allScores) : null;
  return { avg: avg !== null ? Math.round(avg * 10) / 10 : null, best };
}

// ─── Counter Button ───────────────────────────────────────────────────────────

interface CounterBtnProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  large?: boolean;
  colorClass?: string;
}

function CounterBtn({ label, value, onIncrement, onDecrement, large, colorClass = '' }: CounterBtnProps) {
  return (
    <div className={`flex flex-col items-center gap-1 ${large ? 'flex-1' : ''}`}>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className={`flex items-center gap-2 ${large ? 'gap-4' : 'gap-2'}`}>
        <button
          onClick={onDecrement}
          className={`
            ${large ? 'w-16 h-16 text-3xl' : 'w-11 h-11 text-xl'}
            rounded-2xl border-2 border-border bg-card font-bold
            flex items-center justify-center
            active:scale-90 transition-transform duration-100
            hover:border-primary/40 hover:bg-muted
            select-none touch-manipulation
          `}
        >
          −
        </button>
        <span className={`
          ${large ? 'text-5xl w-16 font-display' : 'text-2xl w-10 font-semibold'}
          text-center font-bold ${colorClass || 'text-foreground'}
        `}>
          {value}
        </span>
        <button
          onClick={onIncrement}
          className={`
            ${large ? 'w-16 h-16 text-3xl' : 'w-11 h-11 text-xl'}
            rounded-2xl border-2 border-primary bg-primary text-primary-foreground font-bold
            flex items-center justify-center
            active:scale-90 transition-transform duration-100
            hover:bg-primary/90
            select-none touch-manipulation
          `}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ActiveRoundPage() {
  const [, navigate] = useLocation();
  const [round, setRound] = useState<Round | null>(null);
  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  useEffect(() => {
    const ar = getActiveRound();
    if (!ar) { navigate('/'); return; }
    setRound(ar);
  }, [navigate]);

  const currentHole = round?.holes[currentHoleIdx];
  const course = round ? getCourseById(round.courseId) : undefined;
  const teeBox = course?.teeBoxes.find(t => t.id === round?.teeBoxId);
  const holeInfo = teeBox?.holes.find(h => h.number === currentHole?.holeNumber);

  function updateHoleScore(field: keyof HoleScore, delta: number) {
    if (!round) return;
    const updated: Round = {
      ...round,
      holes: round.holes.map((h, i) => {
        if (i !== currentHoleIdx) return h;
        const newVal = Math.max(0, h[field] + delta);
        // Strokes minimum is 1 if we've started (allow 0 as "not yet played")
        const finalVal = field === 'strokes' ? Math.max(0, newVal) : newVal;
        return { ...h, [field]: finalVal };
      }),
    };
    setRound(updated);
    setActiveRound(updated);
  }

  function goToHole(idx: number) {
    if (!round) return;
    if (idx < 0 || idx >= round.holes.length) return;
    setCurrentHoleIdx(idx);
  }

  function handleFinishRound() {
    if (!round || !teeBox) return;

    // Fill any unplayed holes with average from last 5 rounds on this course/tee
    const missingCount = round.holes.filter(h => h.strokes === 0).length;
    const filledHoles = fillMissingHoles(round.holes, round.courseId, round.teeBoxId, teeBox, loadRounds);
    if (missingCount > 0) {
      toast.info(`${missingCount} unplayed hole${missingCount > 1 ? 's' : ''} filled with your course average.`);
    }

    // Calculate score differential using filled holes
    const ags = calcAdjustedGrossScore(filledHoles, teeBox);
    const is9Hole = round.roundType !== '18';

    // Get current handicap index for 9-hole pairing
    const allRounds = loadRounds();
    const completedDiffs = allRounds
      .filter(r => r.isComplete && r.scoreDifferential !== undefined)
      .map(r => r.scoreDifferential!);
    const currentHcp = calcHandicapIndex(completedDiffs);

    let scoreDiff: number;
    let nineHoleDiff: number | undefined;

    if (is9Hole) {
      nineHoleDiff = calc9HoleDifferential(ags, teeBox.courseRating, teeBox.slopeRating);
      scoreDiff = compute9HoleEquivalentDiff(nineHoleDiff, currentHcp);
    } else {
      scoreDiff = calcScoreDifferential(ags, teeBox.courseRating, teeBox.slopeRating);
    }

    const completedRound: Round = {
      ...round,
      holes: filledHoles,
      isComplete: true,
      adjustedGrossScore: ags,
      scoreDifferential: Math.round(scoreDiff * 10) / 10,
      nineHoleDifferential: nineHoleDiff !== undefined ? Math.round(nineHoleDiff * 10) / 10 : undefined,
    };

    saveRound(completedRound);
    setActiveRound(null);
    toast.success('Round completed! Handicap updated.');
    navigate('/handicap');
  }

  function handleAbandonRound() {
    setShowAbandonConfirm(true);
  }

  if (!round || !currentHole) {
    return (
      <AppShell title="Active Round" showBack onBack={() => navigate('/')}>
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No active round. Start one from the home screen.</p>
        </div>
      </AppShell>
    );
  }

  const totalHoles = round.holes.length;
  const completedHoles = round.holes.filter(h => h.strokes > 0).length;
  const totalStrokes = calcTotalStrokes(round.holes);
  const scoreVsPar = teeBox ? calcScoreVsPar(round.holes.filter(h => h.strokes > 0), teeBox) : 0;
  const scoreLabel = holeInfo ? getScoreLabel(currentHole.strokes, holeInfo.par) : null;
  const scoreColorClass = scoreLabel ? getScoreColor(scoreLabel) : '';

  return (
    <AppShell
      title={showScorecard ? 'Scorecard' : round.courseName}
      showBack={showScorecard}
      onBack={() => setShowScorecard(false)}
      noPadding={!showScorecard}
      headerRight={
        !showScorecard ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScorecard(true)}
              className="text-xs text-primary-foreground/80 font-semibold px-2 py-1 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
            >
              Scorecard
            </button>
            <button
              onClick={handleAbandonRound}
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all text-primary-foreground/70"
            >
              <X size={18} />
            </button>
          </div>
        ) : undefined
      }
    >
      {showScorecard ? (
        <ScorecardView round={round} teeBox={teeBox} onFinish={() => setShowFinishConfirm(true)} />
      ) : (
        <div className="flex flex-col h-[calc(100vh-56px-64px)] max-w-md mx-auto">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(completedHoles / totalHoles) * 100}%` }}
            />
          </div>

          {/* Hole header */}
          <div className="bg-primary/5 border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Hole {currentHoleIdx + 1} of {totalHoles}
                </p>
                {holeInfo && (
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-display font-bold text-foreground text-lg">
                      Par {holeInfo.par}
                    </span>
                    <span className="text-sm text-muted-foreground">{holeInfo.yardage} yds</span>
                    <span className="text-xs text-muted-foreground">HCP #{holeInfo.handicapRank}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Running Total</p>
                <p className="font-display font-bold text-foreground">
                  {totalStrokes > 0 ? totalStrokes : '—'}
                  {teeBox && completedHoles > 0 && (
                    <span className={`ml-1 text-sm ${scoreVsPar > 0 ? 'text-amber-600' : scoreVsPar < 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      ({formatScoreVsPar(scoreVsPar)})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {/* Per-hole course stats */}
            {holeInfo && (() => {
              const hs = getHoleStats(round.courseId, round.teeBoxId, currentHole.holeNumber);
              if (hs.avg === null && hs.best === null) return null;
              return (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                  {hs.avg !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Avg (last 5)</span>
                      <span className={`text-xs font-bold ml-1 ${
                        hs.avg - holeInfo.par < 0 ? 'text-emerald-600'
                        : hs.avg - holeInfo.par > 0 ? 'text-amber-600'
                        : 'text-muted-foreground'
                      }`}>
                        {hs.avg % 1 === 0 ? hs.avg : hs.avg.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {hs.avg !== null && hs.best !== null && (
                    <span className="text-muted-foreground/30 text-xs">·</span>
                  )}
                  {hs.best !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Best</span>
                      <span className={`text-xs font-bold ml-1 ${
                        hs.best - holeInfo.par < 0 ? 'text-emerald-600'
                        : hs.best - holeInfo.par > 0 ? 'text-amber-600'
                        : 'text-muted-foreground'
                      }`}>
                        {hs.best}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Main counter area */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
            {/* Score label badge */}
            {currentHole.strokes > 0 && scoreLabel && (
              <div className={`px-4 py-1 rounded-full text-sm font-bold capitalize ${scoreColorClass}`}>
                {scoreLabel === 'triple+' ? 'Triple+' : scoreLabel.charAt(0).toUpperCase() + scoreLabel.slice(1)}
              </div>
            )}

            {/* Shot Counter — large, prominent */}
            <CounterBtn
              label="Strokes"
              value={currentHole.strokes}
              onIncrement={() => updateHoleScore('strokes', 1)}
              onDecrement={() => updateHoleScore('strokes', -1)}
              large
              colorClass="text-foreground"
            />

            {/* Putts + Penalties row */}
            <div className="flex items-start justify-center gap-8 w-full">
              <CounterBtn
                label="Putts"
                value={currentHole.putts}
                onIncrement={() => updateHoleScore('putts', 1)}
                onDecrement={() => updateHoleScore('putts', -1)}
              />
              <CounterBtn
                label="Penalties"
                value={currentHole.penalties}
                onIncrement={() => updateHoleScore('penalties', 1)}
                onDecrement={() => updateHoleScore('penalties', -1)}
              />
            </div>
          </div>

          {/* Hole navigation */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => goToHole(currentHoleIdx - 1)}
                disabled={currentHoleIdx === 0}
                className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
              >
                <ChevronLeft size={22} />
              </button>

              {/* Hole dots */}
              <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto py-1">
                {round.holes.map((h, i) => (
                  <button
                    key={h.holeNumber}
                    onClick={() => goToHole(i)}
                    className={`
                      flex-shrink-0 transition-all active:scale-90
                      ${i === currentHoleIdx
                        ? 'w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold'
                        : h.strokes > 0
                          ? 'w-5 h-5 rounded-full bg-accent/80 text-accent-foreground text-[10px] font-semibold'
                          : 'w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px]'
                      }
                      flex items-center justify-center
                    `}
                  >
                    {i === currentHoleIdx ? h.holeNumber : h.strokes > 0 ? h.strokes : '·'}
                  </button>
                ))}
              </div>

              {currentHoleIdx < totalHoles - 1 ? (
                <button
                  onClick={() => goToHole(currentHoleIdx + 1)}
                  className="w-12 h-12 rounded-xl border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-transform"
                >
                  <ChevronRight size={22} />
                </button>
              ) : (
                <button
                  onClick={() => setShowFinishConfirm(true)}
                  className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Flag size={20} />
                </button>
              )}
            </div>

            {/* Finish round button (always visible at last hole or via scorecard) */}
            {completedHoles === totalHoles && (
              <Button
                onClick={() => setShowFinishConfirm(true)}
                className="w-full h-12 mt-3 bg-accent text-accent-foreground font-semibold text-base active:scale-[0.98] transition-transform rounded-xl"
              >
                <CheckCircle2 size={18} className="mr-2" />
                Finish Round
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Finish Confirm Dialog */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-display font-bold text-xl mb-2">Finish Round?</h3>
            <p className="text-muted-foreground text-sm mb-1">
              Total strokes: <strong className="text-foreground">{totalStrokes}</strong>
            </p>
            {completedHoles < totalHoles && (
              <p className="text-amber-600 text-sm mb-1">
                ⚠️ {totalHoles - completedHoles} hole(s) have no strokes entered.
              </p>
            )}
            <p className="text-muted-foreground text-sm mb-5">
              Your score differential will be calculated and your handicap index updated.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setShowFinishConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform"
                onClick={() => { setShowFinishConfirm(false); handleFinishRound(); }}
              >
                <CheckCircle2 size={16} className="mr-1" />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Abandon Round Confirmation */}
      <AlertDialog open={showAbandonConfirm} onOpenChange={setShowAbandonConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandon Round?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost and this round will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Playing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setActiveRound(null); navigate('/'); }}
            >
              Abandon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

// ─── Scorecard View ───────────────────────────────────────────────────────────

interface ScorecardViewProps {
  round: Round;
  teeBox: ReturnType<typeof getCourseById> extends undefined ? undefined : any;
  onFinish: () => void;
}

function ScorecardView({ round, teeBox, onFinish }: ScorecardViewProps) {
  const totalStrokes = calcTotalStrokes(round.holes);
  const completedHoles = round.holes.filter(h => h.strokes > 0).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-display font-bold text-foreground">{round.courseName}</p>
              <p className="text-xs text-muted-foreground">{round.teeBoxName} tees · {round.roundType === '18' ? '18 holes' : '9 holes'}</p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-3xl text-foreground">{totalStrokes || '—'}</p>
              {teeBox && completedHoles > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formatScoreVsPar(calcScoreVsPar(round.holes.filter(h => h.strokes > 0), teeBox))}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted rounded-lg p-2">
              <p className="font-bold text-lg text-foreground">{round.holes.reduce((s, h) => s + h.putts, 0)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Putts</p>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <p className="font-bold text-lg text-foreground">{round.holes.reduce((s, h) => s + h.penalties, 0)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Penalties</p>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <p className="font-bold text-lg text-foreground">{completedHoles}/{round.holes.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Holes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hole-by-hole table */}
      <Card className="border border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-xs">Hole</th>
                  <th className="text-center px-2 py-2 font-semibold text-xs">Par</th>
                  <th className="text-center px-2 py-2 font-semibold text-xs">Yds</th>
                  <th className="text-center px-2 py-2 font-semibold text-xs">Score</th>
                  <th className="text-center px-2 py-2 font-semibold text-xs">Putts</th>
                  <th className="text-center px-2 py-2 font-semibold text-xs">Pen</th>
                  <th className="text-center px-2 py-2 font-semibold text-xs">+/-</th>
                </tr>
              </thead>
              <tbody>
                {round.holes.map((hole, i) => {
                  const hi = teeBox?.holes.find((h: any) => h.number === hole.holeNumber);
                  const par = hi?.par ?? 4;
                  const diff = hole.strokes > 0 ? hole.strokes - par : null;
                  const label = hole.strokes > 0 ? getScoreLabel(hole.strokes, par) : null;
                  const colorClass = label ? getScoreColor(label) : '';
                  return (
                    <tr key={hole.holeNumber} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                      <td className="px-3 py-2 font-semibold text-foreground">{hole.holeNumber}</td>
                      <td className="text-center px-2 py-2 text-muted-foreground">{par}</td>
                      <td className="text-center px-2 py-2 text-muted-foreground text-xs">{hi?.yardage ?? '—'}</td>
                      <td className="text-center px-2 py-2">
                        {hole.strokes > 0 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${colorClass}`}>
                            {hole.strokes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="text-center px-2 py-2 text-foreground">{hole.putts || '—'}</td>
                      <td className="text-center px-2 py-2 text-foreground">{hole.penalties || '—'}</td>
                      <td className={`text-center px-2 py-2 font-semibold text-sm ${
                        diff === null ? 'text-muted-foreground/40'
                        : diff < 0 ? 'text-emerald-600'
                        : diff > 0 ? 'text-amber-600'
                        : 'text-muted-foreground'
                      }`}>
                        {diff === null ? '—' : formatScoreVsPar(diff)}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="bg-primary/10 font-bold border-t-2 border-primary/20">
                  <td className="px-3 py-2 text-foreground">Total</td>
                  <td className="text-center px-2 py-2 text-foreground">
                    {teeBox ? teeBox.holes.filter((h: any) => round.holes.some(rh => rh.holeNumber === h.number)).reduce((s: number, h: any) => s + h.par, 0) : '—'}
                  </td>
                  <td className="text-center px-2 py-2 text-muted-foreground text-xs">
                    {teeBox ? teeBox.holes.filter((h: any) => round.holes.some(rh => rh.holeNumber === h.number)).reduce((s: number, h: any) => s + h.yardage, 0) : '—'}
                  </td>
                  <td className="text-center px-2 py-2 text-foreground font-display text-lg">{totalStrokes || '—'}</td>
                  <td className="text-center px-2 py-2 text-foreground">{round.holes.reduce((s, h) => s + h.putts, 0)}</td>
                  <td className="text-center px-2 py-2 text-foreground">{round.holes.reduce((s, h) => s + h.penalties, 0)}</td>
                  <td className="text-center px-2 py-2">
                    {teeBox && completedHoles > 0
                      ? formatScoreVsPar(calcScoreVsPar(round.holes.filter(h => h.strokes > 0), teeBox))
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onFinish}
        className="w-full h-12 bg-accent text-accent-foreground font-semibold text-base active:scale-[0.98] transition-transform rounded-xl"
      >
        <Flag size={18} className="mr-2" />
        Finish & Save Round
      </Button>
    </div>
  );
}
