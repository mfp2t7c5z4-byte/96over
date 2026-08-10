/**
 * Golf Tracker — Round History Page
 * Clubhouse Modern: list of all completed rounds with scores and differentials.
 */
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Flag, Trash2, Plus, Edit2, Users, BarChart2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { getRounds, deleteRound, getCourseById, getCourses, type Round, type Course } from '@/lib/storage';
import {
  calcTotalStrokes, calcTotalPutts, calcTotalPenalties,
  formatScoreVsPar, calcScoreVsPar,
} from '@/lib/handicap';
import LogPastRoundDialog from '@/components/LogPastRoundDialog';
import CourseStatsSheet from '@/components/CourseStatsSheet';
import PerCourseStatsSheet from '@/components/PerCourseStatsSheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RoundHistoryPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showLogPast, setShowLogPast] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [showCourseStats, setShowCourseStats] = useState(false);
  const [showPerCourseStats, setShowPerCourseStats] = useState(false);
  const [deleteRoundId, setDeleteRoundId] = useState<string | null>(null);

  function reload() {
    const r = getRounds().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRounds(r);
    setCourses(getCourses());
  }

  useEffect(() => { reload(); }, []);

  function handleDelete(id: string) {
    setDeleteRoundId(id);
  }

  function handleEdit(round: Round) {
    setEditingRound(round);
    setShowLogPast(true);
  }

  return (
    <AppShell
      title="Round History"
      headerRight={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPerCourseStats(true)}
            className="flex items-center gap-1 bg-white/15 text-primary-foreground px-2.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
            title="Per-course stats"
          >
            <BarChart2 size={13} /> Courses
          </button>
          <button
            onClick={() => setShowCourseStats(true)}
            className="flex items-center gap-1 bg-white/15 text-primary-foreground px-2.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
            title="Per-hole stats"
          >
            <BarChart2 size={13} /> Holes
          </button>
          <button
            onClick={() => setShowLogPast(true)}
            className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-semibold active:scale-95 transition-transform"
          >
            <Plus size={14} /> Log Past
          </button>
        </div>
      }
    >
      {rounds.length === 0 ? (
        <Card className="border-dashed border-2 border-border mt-4">
          <CardContent className="p-8 text-center">
            <Flag size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-display font-bold text-foreground mb-1">No Rounds Yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start a live round or log a past one.</p>
            <button
              onClick={() => setShowLogPast(true)}
              className="flex items-center gap-1.5 mx-auto bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            >
              <Plus size={14} /> Log Past Round
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 mt-2">
          {rounds.map(round => (
            <RoundHistoryCard key={round.id} round={round} onDelete={() => handleDelete(round.id)} onEdit={() => handleEdit(round)} />
          ))}
        </div>
      )}

      <LogPastRoundDialog
        open={showLogPast}
        onClose={() => { setShowLogPast(false); setEditingRound(null); }}
        courses={courses}
        onRoundSaved={reload}
        editRound={editingRound}
      />

      <CourseStatsSheet
        open={showCourseStats}
        onClose={() => setShowCourseStats(false)}
      />

      <PerCourseStatsSheet
        open={showPerCourseStats}
        onOpenChange={setShowPerCourseStats}
        rounds={rounds}
        courses={courses}
      />

      <AlertDialog open={!!deleteRoundId} onOpenChange={open => !open && setDeleteRoundId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Round?</AlertDialogTitle>
            <AlertDialogDescription>
              This round will be permanently deleted and your handicap recalculated. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteRoundId) {
                  deleteRound(deleteRoundId);
                  reload();
                  toast.success('Round deleted');
                  setDeleteRoundId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function RoundHistoryCard({ round, onDelete, onEdit }: { round: Round; onDelete: () => void; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const course = getCourseById(round.courseId);
  const teeBox = course?.teeBoxes.find(t => t.id === round.teeBoxId);
  const totalStrokes = calcTotalStrokes(round.holes);
  const totalPutts = calcTotalPutts(round.holes);
  const totalPenalties = calcTotalPenalties(round.holes);
  const scoreVsPar = teeBox ? calcScoreVsPar(round.holes.filter(h => h.strokes > 0), teeBox) : null;
  const date = new Date(round.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <Card className="border border-border overflow-hidden">
      <CardContent className="p-0">
        <div
          className="p-4 cursor-pointer active:bg-muted/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground truncate">{round.courseName}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
              {round.roundName && (
                <p className="text-xs font-semibold text-primary flex items-center gap-1 mt-0.5">
                  <Tag size={10} className="flex-shrink-0" />
                  {round.roundName}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{round.teeBoxName} tees · {round.roundType === '18' ? '18 holes' : '9 holes'}</p>
              {round.playingPartners && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users size={11} className="flex-shrink-0" />
                  {round.playingPartners}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 ml-3">
              <div className="text-right">
                {totalStrokes > 0 && (
                  <>
                    <p className="font-display font-bold text-2xl text-foreground">{totalStrokes}</p>
                    {scoreVsPar !== null && (
                      <p className={`text-xs font-semibold ${scoreVsPar < 0 ? 'text-emerald-600' : scoreVsPar > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {formatScoreVsPar(scoreVsPar)}
                      </p>
                    )}
                  </>
                )}
                {!round.isComplete && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">In Progress</span>
                )}
              </div>
              {round.scoreDifferential !== undefined && (
                <div className="text-right">
                  <p className={`font-semibold text-sm ${round.scoreDifferential <= 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                    {round.scoreDifferential > 0 ? '+' : ''}{round.scoreDifferential.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">diff</p>
                </div>
              )}
              <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="p-2 rounded-lg hover:bg-destructive/10 active:scale-95 transition-all text-destructive"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                className="p-2 rounded-lg hover:bg-primary/10 active:scale-95 transition-all text-primary"
                title="Edit round"
              >
                <Edit2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-border bg-muted/20 px-4 py-3">
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-card rounded-lg p-2 border border-border">
                <p className="font-bold text-foreground">{totalPutts}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Putts</p>
              </div>
              <div className="bg-card rounded-lg p-2 border border-border">
                <p className="font-bold text-foreground">{totalPenalties}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Penalties</p>
              </div>
              <div className="bg-card rounded-lg p-2 border border-border">
                <p className="font-bold text-foreground">{round.holes.filter(h => h.strokes > 0).length}/{round.holes.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Holes</p>
              </div>
            </div>
            {round.nineHoleDifferential !== undefined && (
              <p className="text-xs text-muted-foreground">
                9-hole differential: {round.nineHoleDifferential.toFixed(1)} → 18-hole equivalent: {round.scoreDifferential?.toFixed(1)}
              </p>
            )}
            {/* Hole scores mini table */}
            <div className="overflow-x-auto mt-2">
              <table className="text-xs w-full min-w-[320px]">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1">Hole</th>
                    {round.holes.map(h => <th key={h.holeNumber} className="text-center px-1 min-w-[24px]">{h.holeNumber}</th>)}
                    <th className="text-center px-1">Tot</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-muted-foreground py-0.5">Score</td>
                    {round.holes.map(h => {
                      const hi = teeBox?.holes.find(th => th.number === h.holeNumber);
                      const par = hi?.par ?? 4;
                      const diff = h.strokes > 0 ? h.strokes - par : null;
                      return (
                        <td key={h.holeNumber} className={`text-center px-1 font-semibold ${
                          diff === null ? 'text-muted-foreground/40'
                          : diff < 0 ? 'text-emerald-600'
                          : diff > 0 ? 'text-amber-600'
                          : 'text-muted-foreground'
                        }`}>
                          {h.strokes > 0 ? h.strokes : '—'}
                        </td>
                      );
                    })}
                    <td className="text-center px-1 font-bold text-foreground">{totalStrokes || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
