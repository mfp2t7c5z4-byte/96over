/**
 * Golf Tracker — Home / Dashboard Page
 * Clubhouse Modern: hero banner, handicap index card, quick-start round,
 * recent rounds summary. Forest green + ivory + amber gold.
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import AppShell from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flag, ChevronRight, Plus, History } from 'lucide-react';
import {
  getCourses,
  getRounds,
  getActiveRound,
  getSettings,
  type Round,
  type Course,
} from '@/lib/storage';
import {
  calcHandicapIndex,
  formatScoreVsPar,
  calcTotalStrokes,
} from '@/lib/handicap';
import StartRoundDialog from '@/components/StartRoundDialog';
import LogPastRoundDialog from '@/components/LogPastRoundDialog';

export default function Home() {
  const [, navigate] = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [handicapIndex, setHandicapIndex] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState('Golfer');
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showLogPastDialog, setShowLogPastDialog] = useState(false);
  const [activeRound, setActiveRound] = useState<Round | null>(null);

  useEffect(() => {
    const c = getCourses();
    const r = getRounds();
    const s = getSettings();
    const ar = getActiveRound();
    setCourses(c);
    setRounds(r.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPlayerName(s.playerName);
    setActiveRound(ar);

    // Calculate handicap from completed rounds
    const completedDiffs = r
      .filter(rd => rd.isComplete && rd.scoreDifferential !== undefined)
      .map(rd => rd.scoreDifferential!);
    setHandicapIndex(calcHandicapIndex(completedDiffs));
  }, []);

  const recentRounds = rounds.slice(0, 5);

  function refreshData() {
    const c = getCourses();
    const r = getRounds();
    setCourses(c);
    setRounds(r.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const completedDiffs = r
      .filter(rd => rd.isComplete && rd.scoreDifferential !== undefined)
      .map(rd => rd.scoreDifferential!);
    setHandicapIndex(calcHandicapIndex(completedDiffs));
  }

  return (
    <AppShell
      title="96 Over"
      headerRight={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogPastDialog(true)}
            className="flex items-center gap-1 bg-white/15 text-primary-foreground px-2.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
            title="Log a past round"
          >
            <History size={13} />
            Past
          </button>
          <button
            onClick={() => setShowStartDialog(true)}
            className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-semibold active:scale-95 transition-transform"
          >
            <Plus size={14} />
            New Round
          </button>
        </div>
      }
    >
      {/* Hero Banner */}
      <div
        className="relative rounded-2xl overflow-hidden mb-5 h-40"
        style={{
          backgroundImage: `url('/manus-storage/golf-hero-bg_eeee22f5.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-0.5">Welcome back</p>
          <h2 className="font-display text-2xl font-bold text-white">{playerName}</h2>
        </div>
      </div>

      {/* Active Round Banner */}
      {activeRound && (
        <Card className="mb-4 border-2 border-accent bg-accent/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-0.5">Round In Progress</p>
                <p className="font-display font-bold text-foreground">{activeRound.courseName}</p>
                <p className="text-sm text-muted-foreground">{activeRound.teeBoxName} tees · {activeRound.roundType === '18' ? '18 holes' : '9 holes'}</p>
              </div>
              <Button
                onClick={() => navigate('/round/active')}
                className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
              >
                Resume
                <ChevronRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      {/* Scoreboard stats — large Playfair numerics, scoreboard-first hierarchy */}
      <div className="mb-5">
        {/* Handicap Index — hero stat */}
        <div className="bg-primary rounded-2xl p-4 mb-3 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-primary-foreground/60 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Handicap Index</p>
            <p className="font-display text-5xl font-bold text-accent leading-none">
              {handicapIndex !== null ? handicapIndex.toFixed(1) : '—'}
            </p>
            <p className="text-primary-foreground/60 text-xs mt-1">
              {handicapIndex !== null ? 'WHS Official' : 'Need 3+ rounds'}
            </p>
          </div>
          {/* Decorative scorecard lines */}
          <div className="opacity-20 flex flex-col gap-1 items-end pr-1">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <div key={n} className="flex gap-0.5 items-center">
                <div className="w-3 h-px bg-primary-foreground" />
                <div className="w-5 h-px bg-primary-foreground" />
                <div className="w-2 h-px bg-primary-foreground" />
              </div>
            ))}
          </div>
        </div>
        {/* Rounds + Courses row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Flag size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-foreground leading-none">
                {rounds.filter(r => r.isComplete).length}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Rounds Played</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-foreground leading-none">{courses.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Courses Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!activeRound && (
        <Button
          onClick={() => {
            if (courses.length === 0) {
              navigate('/courses');
            } else {
              setShowStartDialog(true);
            }
          }}
          className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform rounded-xl mb-5 shadow-md"
        >
          <Flag size={20} className="mr-2" />
          {courses.length === 0 ? 'Add a Course to Start' : 'Start New Round'}
        </Button>
      )}

      {/* Recent Rounds */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-foreground text-base">Recent Rounds</h3>
          {rounds.length > 0 && (
            <button
              onClick={() => navigate('/round/history')}
              className="text-xs text-primary font-semibold flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </button>
          )}
        </div>

        {recentRounds.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Scorecard-style empty state */}
            <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <div key={n} className="w-6 h-6 rounded border border-border/60 flex items-center justify-center">
                    <span className="text-[9px] text-muted-foreground/50 font-medium">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Flag size={20} className="text-primary" />
              </div>
              <p className="font-display font-semibold text-foreground mb-1">Your scorecard awaits</p>
              <p className="text-muted-foreground text-xs">
                {courses.length === 0
                  ? 'Add your home course, then tee off.'
                  : 'Tap "Start New Round" to begin tracking.'}
              </p>
            </div>
          </div>
       ) : (
          <div className="space-y-2">
            {recentRounds.map(round => (
              <RoundCard key={round.id} round={round} />
            ))}
          </div>
        )}
      </div>

      {/* Start Round Dialog */}
      <StartRoundDialog
        open={showStartDialog}
        onClose={() => setShowStartDialog(false)}
        courses={courses}
        onRoundStarted={(round) => {
          setActiveRound(round);
          setShowStartDialog(false);
          navigate('/round/active');
        }}
      />

      {/* Log Past Round Dialog */}
      <LogPastRoundDialog
        open={showLogPastDialog}
        onClose={() => setShowLogPastDialog(false)}
        courses={courses}
        onRoundSaved={refreshData}
      />
    </AppShell>
  );
}

function RoundCard({ round }: { round: Round }) {
  const [, navigate] = useLocation();
  const date = new Date(round.date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const totalStrokes = calcTotalStrokes(round.holes);
  const diff = round.scoreDifferential;

  return (
    <Card
      className="border border-border cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all"
      onClick={() => navigate('/round/history')}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{round.courseName}</p>
            <p className="text-xs text-muted-foreground">{dateStr} · {round.teeBoxName} · {round.roundType === '18' ? '18 holes' : '9 holes'}</p>
            {round.roundName && (
              <p className="text-xs font-semibold text-primary truncate">{round.roundName}</p>
            )}
          </div>
          <div className="flex items-center gap-3 ml-3">
            {round.isComplete && totalStrokes > 0 && (
              <div className="text-right">
                <p className="font-display font-bold text-lg text-foreground">{totalStrokes}</p>
                <p className="text-[10px] text-muted-foreground">strokes</p>
              </div>
            )}
            {diff !== undefined && (
              <div className="text-right">
                <p className={`font-display font-bold text-sm ${diff <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">diff</p>
              </div>
            )}
            {!round.isComplete && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">In Progress</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
