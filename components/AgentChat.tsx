'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Citation = { type: string; value: string; recordId?: string; label?: string | null };
type Turn = {
  role: 'user' | 'agent';
  text: string;
  citations?: Citation[];
  streaming?: boolean;
};

/**
 * Fills its container. The surrounding ChatWidget draws the border, corners
 * and header, so this component supplies none of them.
 */
export default function AgentChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'busy' | 'error'>('starting');
  const [progress, setProgress] = useState<string | null>(null);
  const sequenceRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- open a session on mount -------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/agent/session', { method: 'POST' });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? 'failed');
        if (data.greeting) setTurns([{ role: 'agent', text: data.greeting }]);
        setStatus('idle');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    // Close the session when the tab goes away so Salesforce is not left
    // holding orphaned sessions.
    const close = () => {
      // sendBeacon survives page unload; fetch with keepalive is the fallback.
      const sent = navigator.sendBeacon?.('/api/agent/session/close');
      if (!sent) {
        fetch('/api/agent/session', { method: 'DELETE', keepalive: true }).catch(() => {});
      }
    };
    window.addEventListener('pagehide', close);

    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', close);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, progress]);

  // ---- send a turn --------------------------------------------------------
  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || status !== 'idle') return;

    sequenceRef.current += 1;
    setDraft('');
    setStatus('busy');
    setProgress(null);
    setTurns((t) => [...t, { role: 'user', text }, { role: 'agent', text: '', streaming: true }]);

    const patchLast = (fn: (t: Turn) => Turn) =>
      setTurns((all) => all.map((t, i) => (i === all.length - 1 ? fn(t) : t)));

    try {
      const res = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sequenceId: sequenceRef.current }),
      });

      if (res.status === 410 || res.status === 409) {
        patchLast(() => ({
          role: 'agent',
          text: 'This conversation timed out. Reload the page to start a new one.',
          streaming: false,
        }));
        setStatus('error');
        return;
      }

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const payload = frame
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('\n');

          if (!payload) continue;

          let event: { message?: Record<string, unknown>; messages?: Record<string, unknown>[] };
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }

          // Streaming events wrap a single `message`; the terminal Inform
          // arrives wrapped in a `messages` array. Handle both shapes.
          const msg = event.message ?? event.messages?.[0];
          if (!msg) continue;

          const body = typeof msg.message === 'string' ? msg.message : '';

          switch (msg.type) {
            case 'ProgressIndicator':
              setProgress(body || 'Working on it…');
              break;

            case 'TextChunk':
              setProgress(null);
              patchLast((t) => ({ ...t, text: t.text + body }));
              break;

            case 'ValidationFailureChunk':
              // Salesforce could not validate the partial response. Discard
              // what has been rendered and wait for the authoritative Inform.
              patchLast((t) => ({ ...t, text: '' }));
              break;

            case 'Inform':
              // Authoritative full text — REPLACES the accumulated chunks.
              // Appending here is the classic bug: the reply appears twice.
              setProgress(null);
              patchLast((t) => ({
                ...t,
                text: body || t.text,
                citations: (msg.citedReferences as Citation[]) ?? [],
              }));
              break;

            case 'SessionEnded':
              patchLast((t) => ({ ...t, streaming: false }));
              setStatus('error');
              break;

            case 'EndOfTurn':
              patchLast((t) => ({ ...t, streaming: false }));
              break;
          }
        }
      }

      patchLast((t) => ({ ...t, streaming: false }));
      setStatus((s) => (s === 'error' ? 'error' : 'idle'));
    } catch {
      patchLast(() => ({
        role: 'agent',
        text: 'Something went wrong reaching the assistant. Try sending that again.',
        streaming: false,
      }));
      setProgress(null);
      setStatus('idle');
    }
  }, [draft, status]);

  // ---- render -------------------------------------------------------------
  return (
    <div className="flex h-full w-full flex-col bg-card">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {status === 'starting' && <p className="text-sm text-muted">Connecting…</p>}

        {turns.map((turn, i) => (
          <div key={i} className={turn.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={
                'inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm ' +
                (turn.role === 'user' ? 'bg-brand text-white' : 'bg-wash text-ink')
              }
            >
              {turn.text}
              {turn.streaming && <span className="ml-0.5 animate-pulse">▍</span>}
            </div>

            {turn.citations && turn.citations.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-left text-xs text-muted">
                {turn.citations.map((c, j) => (
                  <li key={j}>
                    <a href={c.value} target="_blank" rel="noreferrer" className="underline">
                      {c.label ?? `Source ${j + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {(status === 'busy' || status === 'error') && (
        <p
          aria-live="polite"
          className={'px-5 pb-2 text-xs ' + (status === 'error' ? 'text-breached' : 'text-muted')}
        >
          {status === 'error'
            ? 'Assistant unavailable. Reload the page to retry.'
            : (progress ?? 'Thinking…')}
        </p>
      )}

      <div className="flex gap-2 border-t border-line p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask about appointments, results, or billing"
          disabled={status === 'starting' || status === 'error'}
          aria-label="Message"
          className="flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-brand disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={status !== 'idle' || !draft.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
