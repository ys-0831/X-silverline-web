import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/agent-config';
import { sfFetch } from '@/lib/sf-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * navigator.sendBeacon can only issue POSTs, so tab-close teardown needs its
 * own endpoint rather than reusing DELETE on the session route.
 */
export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await sfFetch(`/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'x-session-end-reason': 'UserRequest' },
    }).catch(() => {});
  }

  const response = NextResponse.json({ ended: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
