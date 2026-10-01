// lib/sf-auth.ts
//
// OAuth client credentials against Salesforce, plus a thin Agent API client.
// The consumer secret is read here and nowhere else — it must never reach the
// browser, which is why every Salesforce call originates from a route handler.

import { config } from './agent-config';

type CachedToken = { token: string; expiresAt: number };

// Module scope survives across invocations on a warm function instance. This is
// a per-instance cache, not a global one; under load several tokens may be
// minted concurrently, which is acceptable.
let cache: CachedToken | null = null;

// The client credentials response carries no expires_in. Lifetime is governed
// by the org session timeout policy (default 2h, minimum 15 min). Twelve
// minutes sits safely inside every configurable floor.
const TOKEN_TTL_MS = 12 * 60 * 1000;

async function mintToken(): Promise<string> {
  const res = await fetch(`${config.myDomainUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.consumerKey,
      client_secret: config.consumerSecret,
    }),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.access_token) {
    // Salesforce error bodies are safe to log. The secret never is.
    throw new Error(
      `Salesforce token request failed (${res.status}): ${json.error ?? 'unknown'} — ` +
        `${json.error_description ?? 'no description'}`
    );
  }

  cache = { token: json.access_token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return json.access_token;
}

export async function getAccessToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt) return cache.token;
  return mintToken();
}

export function invalidateToken(): void {
  cache = null;
}

/**
 * Calls the Agent API, re-minting the token once on 401. Session timeout
 * policies and secret rotation both produce spurious 401s; one retry removes
 * almost all of them.
 */
export async function sfFetch(path: string, init: RequestInit): Promise<Response> {
  const url = `${config.apiBase}/einstein/ai-agent/v1${path}`;

  const attempt = async (token: string) =>
    fetch(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

  let res = await attempt(await getAccessToken());

  if (res.status === 401) {
    invalidateToken();
    res = await attempt(await getAccessToken());
  }

  return res;
}
