/**
 * Golf Tracker — Courses Management Page
 * Clubhouse Modern: list of saved courses, add/edit course with tee boxes and hole data.
 */
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Trash2, ChevronRight, ChevronDown, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCourses, saveCourse, updateCourse, deleteCourse,
  type Course, type TeeBox, type HoleInfo,
} from '@/lib/storage';
import { nanoid } from 'nanoid';

// ─── Default hole data generators ────────────────────────────────────────────

function defaultHoles(count: 9 | 18, startAt = 1): HoleInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    number: startAt + i,
    par: 4,
    yardage: 350,
    handicapRank: i + 1,
  }));
}

function defaultTeeBox(holeCount: 9 | 18): TeeBox {
  return {
    id: nanoid(),
    name: 'White',
    courseRating: holeCount === 18 ? 72.0 : 36.0,
    slopeRating: 113,
    holes: defaultHoles(holeCount),
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function reload() {
    setCourses(getCourses());
  }

  useEffect(() => { reload(); }, []);

  function handleDelete(id: string, name: string) {
    setDeleteTarget({ id, name });
  }

  return (
    <AppShell
      title="Courses"
      headerRight={
        <button
          onClick={() => { setEditingCourse(null); setShowAddDialog(true); }}
          className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-semibold active:scale-95 transition-transform"
        >
          <Plus size={14} /> Add
        </button>
      }
    >
      {courses.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-card overflow-hidden">
          {/* Yardage book header decoration */}
          <div className="bg-primary px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              {['1','2','3','4','5','6','7','8','9'].map(n => (
                <div key={n} className="text-center">
                  <div className="text-[9px] text-primary-foreground/40 font-medium">{n}</div>
                  <div className="w-5 h-4 border border-primary-foreground/20 rounded-sm mt-0.5" />
                </div>
              ))}
            </div>
            <div className="h-px bg-primary-foreground/20 my-1" />
            <div className="flex items-center justify-between">
              {['10','11','12','13','14','15','16','17','18'].map(n => (
                <div key={n} className="text-center">
                  <div className="text-[9px] text-primary-foreground/40 font-medium">{n}</div>
                  <div className="w-5 h-4 border border-primary-foreground/20 rounded-sm mt-0.5" />
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={22} className="text-primary" />
            </div>
            <p className="font-display font-bold text-foreground text-lg mb-1">No Courses in Your Bag</p>
            <p className="text-sm text-muted-foreground mb-4">Add your home course with tee boxes, par, and yardage to start tracking.</p>
            <Button
              onClick={() => { setEditingCourse(null); setShowAddDialog(true); }}
              className="bg-primary text-primary-foreground h-11 px-6 font-semibold active:scale-95 transition-transform"
            >
              <Plus size={16} className="mr-1" /> Add First Course
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {courses.map(course => (
            <Card key={course.id} className="border border-border overflow-hidden">
              <CardContent className="p-0">
                {/* Course Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors"
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground truncate">{course.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.holeCount} holes · {course.teeBoxes.length} tee box{course.teeBoxes.length !== 1 ? 'es' : ''}
                      {course.city ? ` · ${course.city}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={e => { e.stopPropagation(); setEditingCourse(course); setShowAddDialog(true); }}
                      className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all text-muted-foreground"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(course.id, course.name); }}
                      className="p-2 rounded-lg hover:bg-destructive/10 active:scale-95 transition-all text-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                    {expandedCourse === course.id
                      ? <ChevronDown size={18} className="text-muted-foreground" />
                      : <ChevronRight size={18} className="text-muted-foreground" />
                    }
                  </div>
                </div>

                {/* Expanded: Tee Boxes */}
                {expandedCourse === course.id && (
                  <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
                    {course.teeBoxes.map(tee => (
                      <div key={tee.id} className="bg-card rounded-xl p-3 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-foreground">{tee.name} Tees</span>
                          <span className="text-xs text-muted-foreground">
                            CR {tee.courseRating} / SR {tee.slopeRating}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="text-xs w-full min-w-[400px]">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left py-1 pr-2">Hole</th>
                                {tee.holes.map(h => (
                                  <th key={h.number} className="text-center px-1 min-w-[28px]">{h.number}</th>
                                ))}
                                <th className="text-center px-1">Tot</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="text-muted-foreground pr-2 py-0.5">Par</td>
                                {tee.holes.map(h => (
                                  <td key={h.number} className="text-center px-1 font-medium">{h.par}</td>
                                ))}
                                <td className="text-center px-1 font-bold">{tee.holes.reduce((s, h) => s + h.par, 0)}</td>
                              </tr>
                              <tr>
                                <td className="text-muted-foreground pr-2 py-0.5">Yds</td>
                                {tee.holes.map(h => (
                                  <td key={h.number} className="text-center px-1">{h.yardage}</td>
                                ))}
                                <td className="text-center px-1 font-bold">{tee.holes.reduce((s, h) => s + h.yardage, 0)}</td>
                              </tr>
                              <tr>
                                <td className="text-muted-foreground pr-2 py-0.5">HCP</td>
                                {tee.holes.map(h => (
                                  <td key={h.number} className="text-center px-1 text-muted-foreground">{h.handicapRank}</td>
                                ))}
                                <td className="text-center px-1">—</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <CourseFormDialog
        open={showAddDialog}
        course={editingCourse}
        onClose={() => { setShowAddDialog(false); setEditingCourse(null); }}
        onSaved={() => { reload(); setShowAddDialog(false); setEditingCourse(null); }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteCourse(deleteTarget.id);
                  reload();
                  toast.success('Course deleted');
                  setDeleteTarget(null);
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

// ─── Course Form Dialog ───────────────────────────────────────────────────────

interface CourseFormProps {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onSaved: () => void;
}

function CourseFormDialog({ open, course, onClose, onSaved }: CourseFormProps) {
  const isEdit = !!course;
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [teeBoxes, setTeeBoxes] = useState<TeeBox[]>([]);
  const [activeTeeIdx, setActiveTeeIdx] = useState(0);

  useEffect(() => {
    if (open) {
      if (course) {
        setName(course.name);
        setCity(course.city ?? '');
        setHoleCount(course.holeCount);
        setTeeBoxes(JSON.parse(JSON.stringify(course.teeBoxes)));
        setActiveTeeIdx(0);
      } else {
        setName('');
        setCity('');
        setHoleCount(18);
        setTeeBoxes([defaultTeeBox(18)]);
        setActiveTeeIdx(0);
      }
    }
  }, [open, course]);

  // When holeCount changes, update tee boxes
  function handleHoleCountChange(count: 9 | 18) {
    setHoleCount(count);
    setTeeBoxes(prev => prev.map(t => ({
      ...t,
      holes: defaultHoles(count),
      courseRating: count === 9 ? 36.0 : 72.0,
    })));
  }

  function addTeeBox() {
    const newTee = defaultTeeBox(holeCount);
    newTee.name = `Tee ${teeBoxes.length + 1}`;
    setTeeBoxes(prev => [...prev, newTee]);
    setActiveTeeIdx(teeBoxes.length);
  }

  function removeTeeBox(idx: number) {
    if (teeBoxes.length <= 1) return;
    setTeeBoxes(prev => prev.filter((_, i) => i !== idx));
    setActiveTeeIdx(Math.max(0, activeTeeIdx - 1));
  }

  function updateTee(idx: number, field: keyof Omit<TeeBox, 'id' | 'holes'>, value: string) {
    setTeeBoxes(prev => prev.map((t, i) =>
      i === idx ? { ...t, [field]: field === 'name' ? value : parseFloat(value) || 0 } : t
    ));
  }

  function updateHole(teeIdx: number, holeIdx: number, field: keyof HoleInfo, value: string) {
    setTeeBoxes(prev => prev.map((t, ti) => {
      if (ti !== teeIdx) return t;
      const holes = t.holes.map((h, hi) =>
        hi === holeIdx ? { ...h, [field]: parseInt(value) || 0 } : h
      );
      return { ...t, holes };
    }));
  }

  function handleSave() {
    if (!name.trim()) { toast.error('Course name is required'); return; }
    if (teeBoxes.length === 0) { toast.error('At least one tee box is required'); return; }

    if (isEdit && course) {
      updateCourse(course.id, { name: name.trim(), city: city.trim() || undefined, holeCount, teeBoxes });
      toast.success('Course updated');
    } else {
      saveCourse({ name: name.trim(), city: city.trim() || undefined, holeCount, teeBoxes });
      toast.success('Course saved');
    }
    onSaved();
  }

  const activeTee = teeBoxes[activeTeeIdx];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? 'Edit Course' : 'Add Course'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Name */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Course Name *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Pebble Beach Golf Links"
              className="h-11"
            />
          </div>

          {/* City */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">City / Location</Label>
            <Input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Pebble Beach, CA"
              className="h-11"
            />
          </div>

          {/* Hole Count */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Number of Holes</Label>
            <div className="grid grid-cols-2 gap-2">
              {([18, 9] as const).map(n => (
                <button
                  key={n}
                  onClick={() => handleHoleCountChange(n)}
                  className={`h-11 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${
                    holeCount === n
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground hover:border-primary/40'
                  }`}
                >
                  {n} Holes
                </button>
              ))}
            </div>
          </div>

          {/* Tee Box Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Tee Boxes</Label>
              <button
                onClick={addTeeBox}
                className="text-xs text-primary font-semibold flex items-center gap-1 active:scale-95"
              >
                <Plus size={12} /> Add Tee
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
              {teeBoxes.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTeeIdx(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                    activeTeeIdx === i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {t.name || `Tee ${i + 1}`}
                </button>
              ))}
            </div>

            {activeTee && (
              <div className="space-y-3 bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tee Details</Label>
                  {teeBoxes.length > 1 && (
                    <button
                      onClick={() => removeTeeBox(activeTeeIdx)}
                      className="text-destructive text-xs flex items-center gap-1 active:scale-95"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">Name</Label>
                    <Input
                      value={activeTee.name}
                      onChange={e => updateTee(activeTeeIdx, 'name', e.target.value)}
                      placeholder="White"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Course Rating</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={activeTee.courseRating}
                      onChange={e => updateTee(activeTeeIdx, 'courseRating', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Slope Rating</Label>
                    <Input
                      type="number"
                      value={activeTee.slopeRating}
                      onChange={e => updateTee(activeTeeIdx, 'slopeRating', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Hole-by-hole data */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Hole Data (Par / Yards / HCP Rank)
                  </Label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeTee.holes.map((hole, hi) => (
                      <div key={hole.number} className="grid grid-cols-4 gap-1.5 items-center">
                        <span className="text-xs font-semibold text-muted-foreground text-center">#{hole.number}</span>
                        <div>
                          <Input
                            type="number"
                            min={3}
                            max={5}
                            value={hole.par}
                            onChange={e => updateHole(activeTeeIdx, hi, 'par', e.target.value)}
                            className="h-8 text-sm text-center px-1"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min={50}
                            max={700}
                            value={hole.yardage}
                            onChange={e => updateHole(activeTeeIdx, hi, 'yardage', e.target.value)}
                            className="h-8 text-sm text-center px-1"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min={1}
                            max={18}
                            value={hole.handicapRank}
                            onChange={e => updateHole(activeTeeIdx, hi, 'handicapRank', e.target.value)}
                            className="h-8 text-sm text-center px-1"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-1.5 text-[10px] text-muted-foreground text-center pt-1">
                      <span></span><span>Par</span><span>Yards</span><span>HCP</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform rounded-xl"
          >
            {isEdit ? 'Save Changes' : 'Save Course'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
