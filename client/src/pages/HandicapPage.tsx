/**
 * Golf Tracker — Handicap Index Page
 * Clubhouse Modern: WHS handicap index display, differential history,
 * sparkline trend, best 8 of 20 breakdown.
 */
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart2, Info } from 'lucide-react';
import { getRounds, type Round } from '@/lib/storage';
import {
  calcHandicapIndex,
} from '@/lib/handicap';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function HandicapPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [handicapIndex, setHandicapIndex] = useState<number | null>(null);
  const [differentials, setDifferentials] = useState<number[]>([]);

  useEffect(() => {
    const r = getRounds()
      .filter(rd => rd.isComplete && rd.scoreDifferential !== undefined)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setRounds(r);

    const diffs = r.map(rd => rd.scoreDifferential!);
    setDifferentials(diffs);
    setHandicapIndex(calcHandicapIndex(diffs));
  }, []);

  // Determine which differentials are "used" (best 8 of last 20)
  const recent20 = differentials.slice(-20);
  const sorted20 = [...recent20].sort((a, b) => a - b);
  let countUsed = 0;
  if (recent20.length >= 3) {
    if (recent20.length <= 5) countUsed = 1;
    else if (recent20.length <= 8) countUsed = 2;
    else if (recent20.length <= 9) countUsed = 3;
    else if (recent20.length <= 11) countUsed = 4;
    else if (recent20.length <= 14) countUsed = 5;
    else if (recent20.length <= 16) countUsed = 6;
    else if (recent20.length <= 18) countUsed = 7;
    else countUsed = 8;
  }
  const usedDiffs = new Set(sorted20.slice(0, countUsed));

  // Chart data
  // Build handicap-index-over-time: after each round, recalculate the index
  const indexTrendData = rounds.slice(-20).map((r, i, arr) => {
    const diffsUpToHere = arr.slice(0, i + 1).map(x => x.scoreDifferential!);
    const hcp = calcHandicapIndex(diffsUpToHere);
    return {
      name: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hcp: hcp !== null ? Math.round(hcp * 10) / 10 : null,
      diff: r.scoreDifferential!,
      label: r.roundName ?? r.courseName,
    };
  });

  // Differential trend (existing)
  const chartData = rounds.slice(-20).map((r, i) => ({
    name: `R${differentials.length - Math.min(20, differentials.length) + i + 1}`,
    diff: r.scoreDifferential!,
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const minDiff = differentials.length > 0 ? Math.min(...differentials) : 0;
  const avgDiff = differentials.length > 0 ? differentials.reduce((s, d) => s + d, 0) / differentials.length : 0;

  // Index trend bounds
  const validHcpPoints = indexTrendData.filter(d => d.hcp !== null).map(d => d.hcp as number);
  const hcpMin = validHcpPoints.length > 0 ? Math.floor(Math.min(...validHcpPoints) - 1) : 0;
  const hcpMax = validHcpPoints.length > 0 ? Math.ceil(Math.max(...validHcpPoints) + 1) : 30;
  const latestHcp = validHcpPoints[validHcpPoints.length - 1] ?? null;
  const firstHcp = validHcpPoints[0] ?? null;
  const hcpChange = latestHcp !== null && firstHcp !== null ? Math.round((latestHcp - firstHcp) * 10) / 10 : null;

  return (
    <AppShell title="Handicap Index">
      {/* Main HCP Card */}
      <Card className="mb-4 border border-border overflow-hidden">
        <div className="bg-primary px-5 py-6 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70 mb-1">
            World Handicap System
          </p>
          <div className="flex items-end gap-3">
            <span className="font-display text-6xl font-bold text-accent">
              {handicapIndex !== null ? handicapIndex.toFixed(1) : '—'}
            </span>
            <div className="pb-2">
              <p className="text-primary-foreground/80 text-sm font-medium">Handicap Index</p>
              {handicapIndex !== null && (
                <p className="text-primary-foreground/60 text-xs">
                  {differentials.length < 3
                    ? `${3 - differentials.length} more round(s) needed`
                    : `Best ${countUsed} of last ${Math.min(20, differentials.length)}`}
                </p>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display font-bold text-2xl text-foreground">{differentials.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rounds</p>
            </div>
            <div>
              <p className={`font-display font-bold text-2xl ${minDiff <= 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                {differentials.length > 0 ? minDiff.toFixed(1) : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Best Diff</p>
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-foreground">
                {differentials.length > 0 ? avgDiff.toFixed(1) : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Diff</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Not enough rounds */}
      {differentials.length < 3 && (
        <Card className="mb-4 border border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Building Your Handicap</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You need at least 3 completed rounds to calculate a Handicap Index.
                You have {differentials.length} so far.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      {/* Handicap Index Trend */}
      {indexTrendData.filter(d => d.hcp !== null).length >= 2 && (
        <Card className="mb-4 border border-border overflow-hidden">
          <div className="bg-primary/5 border-b border-border px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Handicap Index Trend
              </p>
              {hcpChange !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  hcpChange < 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : hcpChange > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {hcpChange > 0 ? '+' : ''}{hcpChange} over {indexTrendData.length} rounds
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">Last {indexTrendData.length} completed rounds</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={indexTrendData} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="hcpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a4731" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#1a4731" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.004 286.32)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: 'oklch(0.552 0.016 285.938)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[hcpMin, hcpMax]}
                  tick={{ fontSize: 9, fill: 'oklch(0.552 0.016 285.938)' }}
                  tickLine={false}
                  axisLine={false}
                  tickCount={4}
                />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(1), 'Handicap Index']}
                  labelFormatter={(l: string) => {
                    const pt = indexTrendData.find(d => d.name === l);
                    return pt?.label ?? l;
                  }}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid oklch(0.92 0.004 286.32)' }}
                />
                <Area
                  type="monotone"
                  dataKey="hcp"
                  stroke="#1a4731"
                  strokeWidth={2.5}
                  fill="url(#hcpGrad)"
                  dot={{ fill: '#1a4731', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#c9973a' }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Differential sub-chart */}
          <CardContent className="p-4 pt-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Score Differentials</p>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={chartData} margin={{ top: 2, right: 8, bottom: 0, left: -22 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} tickCount={3} />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(1), 'Differential']}
                  labelFormatter={(l: string) => chartData.find(d => d.name === l)?.date ?? l}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <ReferenceLine y={avgDiff} stroke="#c9973a" strokeDasharray="4 2" strokeWidth={1} />
                <Line
                  type="monotone"
                  dataKey="diff"
                  stroke="#1a4731"
                  strokeWidth={1.5}
                  dot={{ fill: '#1a4731', r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Differentials List */}
      {rounds.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Score Differentials (last {Math.min(20, rounds.length)})
          </p>
          <div className="space-y-2">
          {rounds.slice(-20).reverse().map((r, i) => {
            const diff = r.scoreDifferential!;
            const isUsed = i < countUsed && usedDiffs.has(diff);
            const date = new Date(r.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });
            return (
              <Card key={r.id} className={`border ${isUsed ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    {r.roundName && (
                      <p className="font-display font-bold text-sm text-foreground">{r.roundName}</p>
                    )}
                    <p className={`font-semibold text-sm ${r.roundName ? 'text-muted-foreground' : 'text-foreground'}`}>{r.courseName}</p>
                    <p className="text-xs text-muted-foreground">{date} · {r.teeBoxName}</p>
                      {r.nineHoleDifferential !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          9-hole diff: {r.nineHoleDifferential.toFixed(1)} → 18-hole equiv: {diff.toFixed(1)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isUsed && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                          Used
                        </span>
                      )}
                      <span className={`font-display font-bold text-xl ${diff <= 0 ? 'text-emerald-600' : diff > 10 ? 'text-red-500' : 'text-foreground'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {rounds.length === 0 && differentials.length === 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden mt-2">
          {/* Differential spark empty state */}
          <div className="bg-primary/5 border-b border-border px-4 py-3">
            <div className="flex items-end gap-1 h-8 justify-center">
              {[3,5,4,6,3,5,7,4,6,5,4,3,5,6,4,5,3,4,6,5].map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-sm bg-primary/20"
                  style={{ height: `${h * 4}px` }}
                />
              ))}
            </div>
          </div>
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <BarChart2 size={22} className="text-primary" />
            </div>
            <p className="font-display font-bold text-foreground text-lg mb-1">Your Differential History</p>
            <p className="text-sm text-muted-foreground">Complete 3 rounds to unlock your official WHS Handicap Index.</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
import { Area, AreaChart, CartesianGrid } from 'recharts';
