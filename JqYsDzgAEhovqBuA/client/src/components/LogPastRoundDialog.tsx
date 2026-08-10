/**
 * Golf Tracker — Log / Edit Past Round Dialog
 * Create mode: blank form for a new past round.
 * Edit mode: pre-filled with existing round data; preserves round ID on save.
 * Calculates WHS score differential on save.
 */
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Flag, ChevronDown, ChevronUp, Edit2, Users, Tag } from 'lucide-react';
// Users is used in the Playing Partners field below
import { toast } from 'sonner';
import {
  nanoid, saveRound, getRounds,
  type Course, type Round, type RoundType, type HoleScore,
} from '@/lib/storage';
import {
  calcAdjustedGrossScore, calcScoreDifferential, calc9HoleDifferential,
  compute9HoleEquivalentDiff, calcHandicapIndex, getScoreLabel, getScoreColor,
} from '@/lib/handicap';

interface Props {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  onRoundSaved: () => void;
  /** Pass an existing round to open in edit mode */
  editRound?: Round | null;
}

export default function LogPastRoundDialog({ open, onClose, courses, onRoundSaved, editRound }: Props) {
  const isEdit = !!editRound;

  // Step 1: round setup; Step 2: hole scores
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [courseId, setCourseId] = useState('');
  const [teeBoxId, setTeeBoxId] = useState('');
  const [roundType, setRoundType] = useState<RoundType>('18');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [roundName, setRoundName] = useState('');

  // Step 2: hole scores
  const [playingPartners, setPlayingPartners] = useState('');

  // Step 2: hole scores
  const [holes, setHoles] = useState<HoleScore[]>([]);
  const [expandedHole, setExpandedHole] = useState<number | null>(null);

  // Guard: don't overwrite pre-filled holes when useEffect for hole-rebuild fires
  const holesInitialised = useRef(false);

  const selectedCourse = courses.find(c => c.id === courseId);
  const selectedTee = selectedCourse?.teeBoxes.find(t => t.id === teeBoxId);

  // Initialise / reset when dialog opens
  useEffect(() => {
    if (!open) return;
    holesInitialised.current = false;
    if (editRound) {
      // Pre-fill from existing round
      const d = new Date(editRound.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setDateStr(`${yyyy}-${mm}-${dd}`);
      setCourseId(editRound.courseId);
      setTeeBoxId(editRound.teeBoxId);
      setRoundType(editRound.roundType);
      setNotes(editRound.notes ?? '');
      setPlayingPartners(editRound.playingPartners ?? '');
      setRoundName(editRound.roundName ?? '');
      setHoles(editRound.holes.map(h => ({ ...h })));
      holesInitialised.current = true;
      setStep(1);
      setExpandedHole(null);
    } else {
      setStep(1);
      setCourseId('');
      setTeeBoxId('');
      setRoundType('18');
      setDateStr(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPlayingPartners('');
      setRoundName('');
      setHoles([]);
      setExpandedHole(null);
    }
  }, [open, editRound]);

  // Rebuild hole list when tee/round type changes — but not on the initial edit pre-fill
  useEffect(() => {
    if (!selectedTee) return;
    if (holesInitialised.current) {
      // First fire after pre-fill: mark as consumed but don't overwrite
      holesInitialised.current = false;
      return;
    }
    let holeNumbers: number[];
    if (roundType === '18') {
      holeNumbers = Array.from({ length: 18 }, (_, i) => i + 1);
    } else if (roundType === '9-front') {
      holeNumbers = Array.from({ length: 9 }, (_, i) => i + 1);
    } else if (roundType === '9-back') {
      holeNumbers = Array.from({ length: 9 }, (_, i) => i + 10);
    } else {
      holeNumbers = Array.from({ length: Math.min(selectedTee.holes.length, 9) }, (_, i) => i + 1);
    }
    const valid = holeNumbers.filter(n => selectedTee.holes.some(h => h.number === n));
    setHoles(valid.map(n => ({ holeNumber: n, strokes: 0, putts: 0, penalties: 0 })));
  }, [selectedTee, roundType]);

  const roundTypeOptions: { value: RoundType; label: string }[] = selectedCourse?.holeCount === 9
    ? [{ value: '9-standalone', label: '9 Holes (Full Course)' }]
    : [
        { value: '18', label: '18 Holes (Full Round)' },
        { value: '9-front', label: '9 Holes — Front 9 (1–9)' },
        { value: '9-back', label: '9 Holes — Back 9 (10–18)' },
      ];

  function updateHole(holeNumber: number, field: keyof HoleScore, delta: number) {
    setHoles(prev => prev.map(h => {
      if (h.holeNumber !== holeNumber) return h;
      const newVal = Math.max(0, (h[field] as number) + delta);
      return { ...h, [field]: newVal };
    }));
  }

  function setHoleField(holeNumber: number, field: keyof HoleScore, value: number) {
    setHoles(prev => prev.map(h =>
      h.holeNumber !== holeNumber ? h : { ...h, [field]: Math.max(0, value) }
    ));
  }

  function handleProceedToScores() {
    if (!courseId) { toast.error('Select a course'); return; }
    if (!teeBoxId) { toast.error('Select a tee box'); return; }
    setStep(2);
    setExpandedHole(holes[0]?.holeNumber ?? null);
  }

  function handleSave() {
    if (!selectedCourse || !selectedTee) return;

    const played = holes.filter(h => h.strokes > 0);
    if (played.length === 0) { toast.error('Enter at least one hole score'); return; }

    // Calculate differential — exclude the round being edited from the HCP baseline
    const ags = calcAdjustedGrossScore(holes, selectedTee);
    const is9Hole = roundType !== '18';

    const allRounds = getRounds();
    const completedDiffs = allRounds
      .filter(r => r.isComplete && r.scoreDifferential !== undefined && r.id !== editRound?.id)
      .map(r => r.scoreDifferential!);
    const currentHcp = calcHandicapIndex(completedDiffs);

    let scoreDiff: number;
    let nineHoleDiff: number | undefined;

    if (is9Hole) {
      nineHoleDiff = calc9HoleDifferential(ags, selectedTee.courseRating, selectedTee.slopeRating);
      scoreDiff = compute9HoleEquivalentDiff(nineHoleDiff, currentHcp);
    } else {
      scoreDiff = calcScoreDifferential(ags, selectedTee.courseRating, selectedTee.slopeRating);
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const roundDate = new Date(y, m - 1, d, 12, 0, 0).toISOString();

    const round: Round = {
      id: editRound?.id ?? nanoid(),   // preserve ID in edit mode
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      teeBoxId: selectedTee.id,
      teeBoxName: selectedTee.name,
      roundType,
      date: roundDate,
      holes,
      adjustedGrossScore: ags,
      scoreDifferential: Math.round(scoreDiff * 10) / 10,
      nineHoleDifferential: nineHoleDiff !== undefined ? Math.round(nineHoleDiff * 10) / 10 : undefined,
      isComplete: true,
      notes: notes.trim() || undefined,
      playingPartners: playingPartners.trim() || undefined,
      roundName: roundName.trim() || undefined,
    };

    saveRound(round);
    toast.success(isEdit ? 'Round updated! Handicap recalculated.' : 'Past round saved! Handicap updated.');
    onRoundSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            {isEdit
              ? <><Edit2 size={18} className="text-primary" /> Edit Round</>
              : <><CalendarDays size={20} className="text-primary" /> Log Past Round</>
            }
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-1">
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {step === 1
            ? (isEdit ? 'Step 1 of 2 — Edit round details' : 'Step 1 of 2 — Round details')
            : (isEdit ? 'Step 2 of 2 — Edit hole scores' : 'Step 2 of 2 — Hole scores')}
        </p>

        {/* ── STEP 1: Round Setup ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Date */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Date Played</Label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={dateStr}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setDateStr(e.target.value)}
                  className="h-11 pl-9"
                />
              </div>
            </div>

            {/* Course */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Course</Label>
              <Select value={courseId} onValueChange={v => { setCourseId(v); setTeeBoxId(''); }}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a course…" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tee Box */}
            {selectedCourse && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Tee Box</Label>
                <Select value={teeBoxId} onValueChange={setTeeBoxId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select tees…" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCourse.teeBoxes.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — CR {t.courseRating} / SR {t.slopeRating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Round Type */}
            {selectedCourse && (
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Round Type</Label>
                <div className="space-y-2">
                  {roundTypeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRoundType(opt.value)}
                      className={`w-full h-11 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all active:scale-95 ${
                        roundType === opt.value
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border text-foreground hover:border-primary/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">
                Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Windy conditions, played well on back 9"
                className="h-11"
              />
            </div>

            {/* Playing Partners */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">
                Playing Partners <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={playingPartners}
                  onChange={e => setPlayingPartners(e.target.value)}
                  placeholder="e.g. James, Sarah, Mike"
                  className="h-11 pl-9"
                />
              </div>
            </div>

            {/* Round Name */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">
                Round Name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={roundName}
                  onChange={e => setRoundName(e.target.value)}
                  placeholder="e.g. Club Championship, Sunday Medal"
                  className="h-11 pl-9"
                />
              </div>
            </div>

            <Button
              onClick={handleProceedToScores}
              disabled={!courseId || !teeBoxId}
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform rounded-xl"
            >
              {isEdit ? 'Next: Review Scores →' : 'Next: Enter Scores →'}
            </Button>
          </div>
        )}

        {/* ── STEP 2: Hole Scores ── */}
        {step === 2 && selectedTee && (
          <div className="space-y-3">
            {/* Summary bar */}
            <div className="bg-primary/5 rounded-xl px-4 py-3 flex items-center justify-between border border-border">
              <div>
                <p className="font-semibold text-sm text-foreground">{selectedCourse?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedTee.name} · {roundType === '18' ? '18 holes' : '9 holes'} ·{' '}
                  {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-2xl text-foreground">
                  {holes.reduce((s, h) => s + h.strokes, 0) || '—'}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Total</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground px-1">Tap a hole to expand putts & penalties.</p>

            <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
              {holes.map(hole => {
                const hi = selectedTee.holes.find(h => h.number === hole.holeNumber);
                const par = hi?.par ?? 4;
                const label = hole.strokes > 0 ? getScoreLabel(hole.strokes, par) : null;
                const colorClass = label ? getScoreColor(label) : '';
                const isExpanded = expandedHole === hole.holeNumber;

                return (
                  <div key={hole.holeNumber} className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Hole row */}
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer active:bg-muted/30 transition-colors"
                      onClick={() => setExpandedHole(isExpanded ? null : hole.holeNumber)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{hole.holeNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground">Par {par}</span>
                        {hi?.yardage && (
                          <span className="text-xs text-muted-foreground ml-2">{hi.yardage} yds</span>
                        )}
                        {hole.putts > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">· {hole.putts} putts</span>
                        )}
                        {hole.penalties > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">· {hole.penalties} pen</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); updateHole(hole.holeNumber, 'strokes', -1); }}
                          className="w-9 h-9 rounded-xl border-2 border-border bg-card font-bold text-lg flex items-center justify-center active:scale-90 transition-transform hover:border-primary/40 select-none"
                        >
                          −
                        </button>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-lg ${
                          hole.strokes > 0 ? colorClass : 'text-muted-foreground/40'
                        }`}>
                          {hole.strokes > 0 ? hole.strokes : '—'}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); updateHole(hole.holeNumber, 'strokes', 1); }}
                          className="w-9 h-9 rounded-xl border-2 border-primary bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center active:scale-90 transition-transform select-none"
                        >
                          +
                        </button>
                        <div className="ml-1 text-muted-foreground">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded: putts + penalties + direct input */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 px-3 py-3 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Putts</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateHole(hole.holeNumber, 'putts', -1)} className="w-9 h-9 rounded-xl border-2 border-border font-bold text-lg flex items-center justify-center active:scale-90 transition-transform select-none">−</button>
                            <span className="w-7 text-center font-bold text-lg text-foreground">{hole.putts}</span>
                            <button onClick={() => updateHole(hole.holeNumber, 'putts', 1)} className="w-9 h-9 rounded-xl border-2 border-primary bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center active:scale-90 transition-transform select-none">+</button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Penalties</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateHole(hole.holeNumber, 'penalties', -1)} className="w-9 h-9 rounded-xl border-2 border-border font-bold text-lg flex items-center justify-center active:scale-90 transition-transform select-none">−</button>
                            <span className="w-7 text-center font-bold text-lg text-foreground">{hole.penalties}</span>
                            <button onClick={() => updateHole(hole.holeNumber, 'penalties', 1)} className="w-9 h-9 rounded-xl border-2 border-primary bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center active:scale-90 transition-transform select-none">+</button>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Or type strokes directly</p>
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            value={hole.strokes || ''}
                            placeholder="0"
                            onChange={e => setHoleField(hole.holeNumber, 'strokes', parseInt(e.target.value) || 0)}
                            className="h-9 text-sm w-24"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Score summary */}
            <div className="bg-muted/40 rounded-xl px-4 py-3 border border-border">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="font-display font-bold text-lg text-foreground">
                    {holes.reduce((s, h) => s + h.strokes, 0) || '—'}
                  </p>
                  <p className="text-muted-foreground uppercase tracking-wide">Strokes</p>
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-foreground">
                    {selectedTee.holes
                      .filter(h => holes.some(rh => rh.holeNumber === h.number))
                      .reduce((s, h) => s + h.par, 0)}
                  </p>
                  <p className="text-muted-foreground uppercase tracking-wide">Par</p>
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-foreground">
                    {holes.reduce((s, h) => s + h.putts, 0)}
                  </p>
                  <p className="text-muted-foreground uppercase tracking-wide">Putts</p>
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-foreground">
                    {holes.reduce((s, h) => s + h.penalties, 0)}
                  </p>
                  <p className="text-muted-foreground uppercase tracking-wide">Pen</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 h-11 bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform"
              >
                <Flag size={16} className="mr-1.5" />
                {isEdit ? 'Save Changes' : 'Save Round'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
