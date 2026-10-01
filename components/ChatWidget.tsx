'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

type Props = {
  /** Rendered inside the panel. Mounted lazily on first open, then kept alive. */
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  launcherLabel?: string;
};

export default function ChatWidget({
  children,
  title = 'Silverline Support',
  subtitle = 'Answers come from an AI assistant',
  launcherLabel = 'Chat with us',
}: Props) {
  const [open, setOpen] = useState(false);
  // The chat is not mounted until the panel is opened, so a visitor who never
  // clicks never starts a Salesforce session. Once mounted it stays mounted,
  // so collapsing the panel does not lose the conversation.
  const [mounted, setMounted] = useState(false);
  const panelId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The widget is mounted in the root layout, so open state already survives
  // client-side navigation between pages. It resets on a full page reload,
  // which is the behaviour we want — a chat panel that reopens itself after a
  // refresh reads as pushy.
  const toggle = useCallback((next: boolean) => {
    setOpen(next);
    if (next) setMounted(true);
  }, []);

  // Escape closes and returns focus to the launcher.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggle(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, toggle]);

  // Move focus into the panel on open so keyboard and screen reader users land
  // somewhere useful rather than at the top of the document.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('input, textarea, button');
      (target ?? panelRef.current)?.focus();
    }, 120);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  // On small screens the panel covers the page, so stop the page behind it
  // scrolling. On desktop it is not modal and the page scrolls normally.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(max-width: 639px)');
    if (!mq.matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // `inert` removes the collapsed panel from focus order and the accessibility
  // tree while keeping it mounted. Cast because typings lag React versions.
  const inertProps = open ? {} : ({ inert: '' } as Record<string, unknown>);

  return (
    <>
      {mounted && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={title}
          aria-hidden={!open}
          tabIndex={-1}
          {...inertProps}
          className={[
            'fixed z-[60] flex flex-col overflow-hidden bg-card shadow-2xl outline-none',
            'motion-safe:transition-[opacity,transform] motion-safe:duration-200',
            'inset-0 rounded-none',
            'sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(620px,calc(100vh-9rem))]',
            'sm:w-[400px] sm:rounded-2xl sm:border sm:border-line',
            open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0',
          ].join(' ')}
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <header className="flex items-start justify-between gap-3 border-b border-line bg-card px-4 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
              <p className="truncate text-xs text-muted">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                toggle(false);
                launcherRef.current?.focus();
              }}
              aria-label="Close chat"
              className="-mr-1 rounded-lg p-2 text-muted hover:bg-wash hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="min-h-0 flex-1">{children}</div>
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => toggle(!open)}
        aria-expanded={open}
        aria-controls={mounted ? panelId : undefined}
        aria-label={open ? 'Close chat' : launcherLabel}
        className={[
          'fixed bottom-6 right-6 z-[61] flex items-center gap-2 rounded-full',
          'bg-brand px-4 py-3.5 text-white shadow-lg hover:opacity-90',
          'motion-safe:transition-transform motion-safe:hover:scale-105',
          open ? 'max-sm:hidden' : '',
        ].join(' ')}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 11.5a8.4 8.4 0 01-9 8.4 9 9 0 01-3.3-.6L3 21l1.8-5.1A8.4 8.4 0 013 11.5a8.4 8.4 0 019-8.4 8.4 8.4 0 019 8.4z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden text-sm font-medium sm:inline">{launcherLabel}</span>
          </>
        )}
      </button>
    </>
  );
}
