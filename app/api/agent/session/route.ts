import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { config, SESSION_COOKIE } from '@/lib/agent-config';
import { sfFetch } from '@/lib/sf-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** POST /api/agent/session — open a conversation with the agent */
export async function POST() {
  try {
    const res = await sfFetch(`/agents/${config.agentId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        externalSessionKey: randomUUID(),
        instanceConfig: { endpoint: config.myDomainUrl },
        streamingCapabilities: { chunkTypes: ['Text'] },
        // Run as the agent's own assigned user rather than the integration
        // user behind the token. Correct for an anonymous public widget.
        bypassUser: true,
      }),
    });

    if (!res.ok) {
      console.error('startSession failed', res.status, await res.text());
      return NextResponse.json(
        { error: 'Could not start a conversation with the assistant.' },
        { status: 502 }
      );
    }

    const data = await res.json();

    const response = NextResponse.json({
      greeting: data.messages?.[0]?.message ?? null,
    });

    // The session id stays out of page JavaScript entirely.
    response.cookies.set(SESSION_COOKIE, data.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('startSession error', err);
    return NextResponse.json({ error: 'The assistant is unavailable.' }, { status: 502 });
  }
}

/** DELETE /api/agent/session — close it politely */
export async function DELETE(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await sfFetch(`/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'x-session-end-reason': 'UserRequest' },
    }).catch((e) => console.error('endSession failed', e));
  }

  const response = NextResponse.json({ ended: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
