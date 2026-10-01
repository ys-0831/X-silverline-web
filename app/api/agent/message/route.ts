import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/agent-config';
import { sfFetch } from '@/lib/sf-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 150;

const MAX_CHARS = 4000;

/**
 * Synchronous alternative to /api/agent/stream — returns the whole reply at
 * once. Kept because it is far easier to debug with curl than an SSE stream.
 */
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
  if (!Number.isInteger(sequenceId) || sequenceId < 1) {
    return NextResponse.json({ error: 'sequenceId must be a positive integer.' }, { status: 400 });
  }

  const res = await sfFetch(`/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ message: { sequenceId, type: 'Text', text: text.trim() } }),
  });

  if (res.status === 404) {
    return NextResponse.json({ error: 'Session expired.', expired: true }, { status: 410 });
  }
  if (!res.ok) {
    console.error('sendMessage failed', res.status, await res.text());
    return NextResponse.json({ error: 'The assistant could not respond.' }, { status: 502 });
  }

  const data = await res.json();
  const reply = data.messages?.[0];

  return NextResponse.json({
    text: reply?.message ?? '',
    citations: reply?.citedReferences ?? [],
  });
}
