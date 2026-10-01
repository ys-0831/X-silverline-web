// lib/salesforce-rest.ts
//
// Thin wrapper over the Salesforce REST Data API.
//
// Deliberately separate from sfFetch() in lib/sf-auth.ts: that helper targets
// the Agent API at api.salesforce.com, while record operations go to your org's
// My Domain host. Both share the same cached access token.

import { config } from './agent-config';
import { getAccessToken, invalidateToken } from './sf-auth';

export const SF_API_VERSION = 'v64.0';

export type SalesforceError = { message: string; errorCode: string; fields?: string[] };

export async function sfRest(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${config.myDomainUrl}/services/data/${SF_API_VERSION}${path}`;

  const attempt = async (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

  let res = await attempt(await getAccessToken());

  if (res.status === 401) {
    invalidateToken();
    res = await attempt(await getAccessToken());
  }

  return res;
}

/** Creates a record and returns its Id. Throws SalesforceRestError on failure. */
export async function createRecord(
  objectName: string,
  fields: Record<string, unknown>
): Promise<string> {
  const res = await sfRest(`/sobjects/${objectName}`, {
    method: 'POST',
    body: JSON.stringify(fields),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new SalesforceRestError(res.status, Array.isArray(body) ? body : []);
  }

  return body.id as string;
}

/** Reads specific fields from a record by Id. Returns null if unreadable. */
export async function readRecord(
  objectName: string,
  id: string,
  fields: string[]
): Promise<Record<string, unknown> | null> {
  const res = await sfRest(
    `/sobjects/${objectName}/${id}?fields=${encodeURIComponent(fields.join(','))}`
  );
  if (!res.ok) return null;
  return res.json();
}

/**
 * Runs a SOQL query. Callers MUST NOT interpolate unvalidated user input into
 * the query string.
 */
export async function soql<T = Record<string, unknown>>(query: string): Promise<T[]> {
  const res = await sfRest(`/query/?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    console.error('SOQL query failed', res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return (data.records ?? []) as T[];
}

export class SalesforceRestError extends Error {
  status: number;
  errors: SalesforceError[];

  constructor(status: number, errors: SalesforceError[]) {
    const first = errors[0];
    super(first ? `${first.errorCode}: ${first.message}` : `Salesforce returned ${status}`);
    this.name = 'SalesforceRestError';
    this.status = status;
    this.errors = errors;
  }

  get code(): string {
    return this.errors[0]?.errorCode ?? 'UNKNOWN';
  }
}
