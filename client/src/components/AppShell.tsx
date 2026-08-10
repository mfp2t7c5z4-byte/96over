/**
 * Golf Tracker — App Shell
 * Wraps all pages with the bottom nav and safe area padding.
 */
import { type ReactNode } from 'react';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  headerRight?: ReactNode;
  noPadding?: boolean;
}

export default function AppShell({
  children,
  title,
  showBack,
  onBack,
  headerRight,
  noPadding,
}: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
          <div className="flex items-center justify-between max-w-md mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {showBack && (
                <button
                  onClick={onBack}
                  className="p-1 -ml-1 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                  aria-label="Back"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
              {!showBack && (
                <img src="/manus-storage/golf-logo_88993864.png" alt="Golf Tracker" className="w-7 h-7 object-contain" />
              )}
              {title === '96 Over' || title === 'Golf Tracker' ? (
                <div className="flex flex-col leading-none">
                  <span className="font-display text-lg font-bold tracking-tight">96 Over</span>
                  <span className="text-[9px] font-medium text-primary-foreground/60 uppercase tracking-widest -mt-0.5">golf tracker</span>
                </div>
              ) : (
                <h1 className="font-display text-lg font-bold tracking-tight">{title}</h1>
              )}
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={`flex-1 max-w-md mx-auto w-full ${noPadding ? '' : 'px-4 py-4'} pb-24`}>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
