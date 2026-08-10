/**
 * Per-Course Stats Sheet
 * Shows average score, best score, and rounds played for each course
 */
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Award, Repeat2 } from 'lucide-react';
import { type Round, type Course } from '@/lib/storage';
import { calcTotalStrokes } from '@/lib/handicap';

interface PerCourseStatsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rounds: Round[];
  courses: Course[];
}

export default function PerCourseStatsSheet({
  open,
  onOpenChange,
  rounds,
  courses,
}: PerCourseStatsSheetProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Calculate per-course stats
  const courseStats = courses.map(course => {
    const courseRounds = rounds.filter(r => r.courseId === course.id && r.holes.some(h => h.strokes > 0));
    if (courseRounds.length === 0) return null;

    const scores = courseRounds.map(r => calcTotalStrokes(r.holes));
    const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const bestScore = Math.min(...scores);

    return {
      courseId: course.id,
      courseName: course.name,
      avgScore,
      bestScore,
      roundsPlayed: courseRounds.length,
    };
  }).filter(Boolean);

  const selectedCourse = selectedCourseId
    ? courseStats.find(s => s?.courseId === selectedCourseId)
    : courseStats[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Per-Course Stats</SheetTitle>
        </SheetHeader>

        {courseStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No course data yet. Play some rounds to see stats.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Course Selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Select Course
              </label>
              <Select value={selectedCourseId || courseStats[0]?.courseId || ''} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courseStats.map(stat => (
                    <SelectItem key={stat!.courseId} value={stat!.courseId}>
                      {stat!.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats Cards */}
            {selectedCourse && (
              <div className="grid grid-cols-3 gap-2">
                {/* Average Score */}
                <Card className="border-border">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp size={16} className="text-accent" />
                    </div>
                    <p className="text-2xl font-bold font-display text-foreground">
                      {selectedCourse.avgScore}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                      Avg Score
                    </p>
                  </CardContent>
                </Card>

                {/* Best Score */}
                <Card className="border-border">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Award size={16} className="text-primary" />
                    </div>
                    <p className="text-2xl font-bold font-display text-foreground">
                      {selectedCourse.bestScore}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                      Best Score
                    </p>
                  </CardContent>
                </Card>

                {/* Rounds Played */}
                <Card className="border-border">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Repeat2 size={16} className="text-secondary" />
                    </div>
                    <p className="text-2xl font-bold font-display text-foreground">
                      {selectedCourse.roundsPlayed}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                      Rounds
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* All Courses Summary Table */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                All Courses
              </h3>
              <div className="space-y-2">
                {courseStats.map(stat => (
                  <div
                    key={stat!.courseId}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCourseId(stat!.courseId)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{stat!.courseName}</p>
                      <p className="text-xs text-muted-foreground">{stat!.roundsPlayed} rounds</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-foreground">
                        {stat!.avgScore}
                      </p>
                      <p className="text-xs text-muted-foreground">avg</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-display font-bold text-primary">
                        {stat!.bestScore}
                      </p>
                      <p className="text-xs text-muted-foreground">best</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
