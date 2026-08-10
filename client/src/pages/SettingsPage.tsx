/**
 * Golf Tracker — Settings & Backup Page
 * Clubhouse Modern: player name, export/import JSON backup.
 */
import { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, Trash2, User, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, saveSettings, exportData, importData, type AppData } from '@/lib/storage';

export default function SettingsPage() {
  const [playerName, setPlayerName] = useState('');
  const [homeClub, setHomeClub] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = getSettings();
    setPlayerName(s.playerName);
    setHomeClub(s.homeClub ?? '');
  }, []);

  function handleSaveSettings() {
    saveSettings({ playerName: playerName.trim() || 'Golfer', homeClub: homeClub.trim() || undefined });
    toast.success('Settings saved');
  }

  function handleExport() {
    const data = exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `golf-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as AppData;
        if (!data.courses && !data.rounds) throw new Error('Invalid format');
        if (confirm(`Import will replace all current data. Continue?\n\nFound: ${data.courses?.length ?? 0} courses, ${data.rounds?.length ?? 0} rounds.`)) {
          importData(data);
          const s = getSettings();
          setPlayerName(s.playerName);
          setHomeClub(s.homeClub ?? '');
          toast.success('Data imported successfully. Refresh to see changes.');
        }
      } catch {
        toast.error('Invalid backup file. Please select a valid Golf Tracker JSON backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleClearData() {
    if (confirm('⚠️ This will permanently delete ALL courses, rounds, and handicap history. This cannot be undone.\n\nAre you absolutely sure?')) {
      if (confirm('Final confirmation: delete all data?')) {
        localStorage.clear();
        toast.success('All data cleared. Refresh the page.');
      }
    }
  }

  return (
    <AppShell title="Settings">
      {/* Player Profile */}
      <Card className="mb-4 border border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">Player Profile</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Your Name</Label>
              <Input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Your name"
                className="h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Home Club</Label>
              <Input
                value={homeClub}
                onChange={e => setHomeClub(e.target.value)}
                placeholder="e.g. Augusta National"
                className="h-11"
              />
            </div>
            <Button
              onClick={handleSaveSettings}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform"
            >
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card className="mb-4 border border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Download size={16} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">Backup & Restore</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            All data is stored locally on this device. Export a JSON backup to save your courses, rounds, and handicap history.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleExport}
              variant="outline"
              className="w-full h-11 font-semibold border-primary text-primary hover:bg-primary/5 active:scale-[0.98] transition-transform"
            >
              <Download size={16} className="mr-2" />
              Export Data (JSON)
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-11 font-semibold active:scale-[0.98] transition-transform"
            >
              <Upload size={16} className="mr-2" />
              Import from Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </CardContent>
      </Card>

      {/* WHS Info */}
      <Card className="mb-4 border border-border bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1">WHS Handicap Rules</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Score Differential = (AGS − Course Rating) × (113 / Slope Rating)</li>
                <li>• Handicap Index = average of best N of last 20 differentials × 0.96</li>
                <li>• 9-hole: paired with expected 9-hole diff (HCP Index ÷ 2) for 18-hole equivalent</li>
                <li>• Minimum 3 rounds required; capped at 54.0</li>
                <li>• ESC (net double bogey) applied per hole</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-destructive/30">
        <CardContent className="p-4">
          <h3 className="font-display font-bold text-destructive mb-2">Danger Zone</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete all local data. Export a backup first.
          </p>
          <Button
            onClick={handleClearData}
            variant="outline"
            className="w-full h-11 border-destructive text-destructive hover:bg-destructive/5 font-semibold active:scale-[0.98] transition-transform"
          >
            <Trash2 size={16} className="mr-2" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

