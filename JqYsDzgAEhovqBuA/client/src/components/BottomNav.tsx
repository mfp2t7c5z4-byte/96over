/**
 * Golf Tracker — Bottom Navigation Bar
 * Clubhouse Modern: forest green bar, ivory icons, amber active indicator.
 * Thumb-reachable, large tap targets.
 */
import { useLocation } from 'wouter';
import { Flag, BookOpen, BarChart2, Settings, History } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Play', icon: Flag },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/round/history', label: 'History', icon: History },
  { path: '/handicap', label: 'Handicap', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-primary/20 safe-area-pb">
      <div className="flex items-stretch max-w-md mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location === path || (path !== '/' && location.startsWith(path));
          return (
            <a
              key={path}
              href={path}
              onClick={e => {
                e.preventDefault();
                window.history.pushState(null, '', path);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className={`flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-accent'
                  : 'text-primary-foreground/70 hover:text-primary-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-accent rounded-full" />
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
