/**
 * Golf Tracker — Start Round Dialog
 * Select course, tee box, round type (18 or 9-hole).
 * Clubhouse Modern: clean modal with large touch targets.
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Flag, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';
import { nanoid, setActiveRound, type Course, type Round, type RoundType } from '@/lib/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  onRoundStarted: (round: Round) => void;
}

export default function StartRoundDialog({ open, onClose, courses, onRoundStarted }: Props) {
  const [courseId, setCourseId] = useState('');
  const [teeBoxId, setTeeBoxId] = useState('');
  const [roundType, setRoundType] = useState<RoundType>('18');
  const [playingPartners, setPlayingPartners] = useState('');
  const [roundName, setRoundName] = useState('');

  const selectedCourse = courses.find(c => c.id === courseId);
  const selectedTee = selectedCourse?.teeBoxes.find(t => t.id === teeBoxId);

  function handleStart() {
    if (!selectedCourse || !selectedTee) return;

    // Determine which holes to include
    let holeNumbers: number[];
    if (roundType === '18') {
      holeNumbers = Array.from({ length: 18 }, (_, i) => i + 1);
    } else if (roundType === '9-front') {
      holeNumbers = Array.from({ length: 9 }, (_, i) => i + 1);
    } else if (roundType === '9-back') {
      holeNumbers = Array.from({ length: 9 }, (_, i) => i + 10);
    } else {
      // standalone 9
      holeNumbers = Array.from({ length: Math.min(selectedTee.holes.length, 9) }, (_, i) => i + 1);
    }

    // Only include holes that exist in the tee box
    const validHoles = holeNumbers.filter(n => selectedTee.holes.some(h => h.number === n));

    const round: Round = {
      id: nanoid(),
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      teeBoxId: selectedTee.id,
      teeBoxName: selectedTee.name,
      roundType,
      date: new Date().toISOString(),
      holes: validHoles.map(n => ({ holeNumber: n, strokes: 0, putts: 0, penalties: 0 })),
      isComplete: false,
      playingPartners: playingPartners.trim() || undefined,
      roundName: roundName.trim() || undefined,
    };

    setActiveRound(round);
    onRoundStarted(round);
  }

  const roundTypeOptions: { value: RoundType; label: string }[] = selectedCourse?.holeCount === 9
    ? [{ value: '9-standalone', label: '9 Holes (Full Course)' }]
    : [
        { value: '18', label: '18 Holes (Full Round)' },
        { value: '9-front', label: '9 Holes (Front 9, holes 1–9)' },
        { value: '9-back', label: '9 Holes (Back 9, holes 10–18)' },
      ];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Flag size={20} className="text-primary" />
            Start New Round
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Course */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Course</Label>
            <Select value={courseId} onValueChange={v => { setCourseId(v); setTeeBoxId(''); }}>
              <SelectTrigger className="h-12">
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
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select tees…" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCourse.teeBoxes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.courseRating} / {t.slopeRating}
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
              <div className="grid grid-cols-1 gap-2">
                {roundTypeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRoundType(opt.value)}
                    className={`h-11 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all active:scale-95 ${
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
            onClick={handleStart}
            disabled={!courseId || !teeBoxId}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform rounded-xl"
          >
            <Flag size={18} className="mr-2" />
            Start Round
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
