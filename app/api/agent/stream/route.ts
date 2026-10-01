import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/agent-config';
import { sfFetch } from '@/lib/sf-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// The Agent API enforces its own 120s timeout. Allowing 150s here means the
// Salesforce error surfaces rather than a Vercel 504.
export const maxDuration = 150;

const MAX_CHARS = 4000;

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'No active session.', expired: true }, { status: 409 });
  }

  const { text, sequenceId } = await req.json().catch(() => ({}));

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `Message exceeds ${MAX_CHARS} characters.` }, { status: 413 });
  }

  const upstream = await sfFetch(`/sessions/${sessionId}/messages/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ message: { sequenceId, type: 'Text', text: text.trim() } }),
  });

  if (upstream.status === 404) {
    return NextResponse.json({ error: 'Session expired.', expired: true }, { status: 410 });
  }

  if (!upstream.ok || !upstream.body) {
    console.error('stream failed', upstream.status, await upstream.text().catch(() => ''));
    return NextResponse.json({ error: 'The assistant could not respond.' }, { status: 502 });
  }

  // Passthrough: forward the upstream SSE body untouched and let the browser
  // parse it. No buffering, no re-serialising, minimal latency.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      // no-transform stops intermediaries collapsing the stream into one blob,
      // which is what makes streaming "work locally, arrive at once in prod".
      'Cache-Control': 'no-cache, no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
