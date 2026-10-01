// app/api/complaints/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  COMPLAINT_OBJECT,
  COMPLAINT_REFERENCE_FIELD,
  DEFAULTS,
  F,
  PATIENT_LOOKUP,
} from '@/lib/complaint-schema';
import {
  ComplaintInput,
  hasErrors,
  looksAutomated,
  validateComplaint,
} from '@/lib/complaint-validation';
import {
  createRecord,
  readRecord,
  SalesforceRestError,
  soql,
} from '@/lib/salesforce-rest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Per-instance throttle. Replace with Vercel Firewall for anything public.
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function throttled(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

/** Finds the patient record to link. Returns null when there's no match. */
async function findPatientId(email: string): Promise<string | null> {
  const safe = email.replace(/'/g, "\\'");
  const rows = await soql<{ Id: string }>(
    `SELECT Id FROM ${PATIENT_LOOKUP.object} ` +
    `WHERE ${PATIENT_LOOKUP.emailField} = '${safe}' LIMIT 1`
  );
  return rows[0]?.Id ?? null;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host && !origin.endsWith(host)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (throttled(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions from this connection. Please try again later.' },
      { status: 429 }
    );
  }

  let input: Partial<ComplaintInput>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  if (looksAutomated(input)) {
    return NextResponse.json({ reference: 'received' }, { status: 201 });
  }

  const errors = validateComplaint(input);
  if (hasErrors(errors)) {
    return NextResponse.json({ fieldErrors: errors }, { status: 422 });
  }

  const subject = (input.subject ?? '').trim();
  const details = (input.details ?? '').trim();
  const fullName = (input.fullName ?? '').trim();
  const email = (input.email ?? '').trim().toLowerCase();

  // Try to link the complaint to an existing patient record.
  let patientId: string | null = null;
  try {
    patientId = await findPatientId(email);
  } catch (err) {
    console.error('patient lookup failed', err instanceof Error ? err.message : err);
  }

  // The object has no field for the submitter's name or email. When no patient
  // record matches, that contact information would otherwise be lost and the
  // complaint would be unactionable — so it is preserved in the details body.
  // Adding Reporter_Name__c and Reporter_Email__c fields is the better fix.
  const body = patientId
    ? details
    : `Submitted by: ${fullName} <${email}>\n(No matching patient record found.)\n\n${details}`;

  const record: Record<string, unknown> = {
    ...DEFAULTS,
    [F.name]: subject,
    [F.details]: body,
  };

  if (patientId) record[F.patient] = patientId;

  try {
    const id = await createRecord(COMPLAINT_OBJECT, record);

    let reference = id;
    if (COMPLAINT_REFERENCE_FIELD) {
      const created = await readRecord(COMPLAINT_OBJECT, id, [COMPLAINT_REFERENCE_FIELD]);
      reference = (created?.[COMPLAINT_REFERENCE_FIELD] as string) ?? id;
    }

    // Identifiers only. The complaint body is health information and must not
    // reach application logs or error trackers.
    console.log('complaint created', { id, linkedToPatient: Boolean(patientId) });

    return NextResponse.json({ reference }, { status: 201 });
  } catch (err) {
    if (err instanceof SalesforceRestError) {
      console.error('complaint create failed', err.status, err.code, err.errors);

      const guidance: Record<string, string> = {
        INVALID_TYPE: `Object "${COMPLAINT_OBJECT}" does not exist, or the integration user cannot access it.`,
        INVALID_FIELD: 'A field API name in lib/complaint-schema.ts does not match the org.',
        REQUIRED_FIELD_MISSING: 'The object requires a field this form does not send.',
        INSUFFICIENT_ACCESS_OR_READONLY:
          'The integration user lacks Create permission on the object or a field. ' +
          'Note that Name cannot be written if it is an Auto Number field.',
        INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST:
          'Status__c or Priority__c in DEFAULTS does not match the picklist values in Salesforce.',
        STRING_TOO_LONG: 'A value exceeded the field length defined in Salesforce.',
        MALFORMED_ID: 'The patient lookup returned an Id the Patient__c field will not accept — check what it references.',
      };

      const detail =
        process.env.NODE_ENV === 'development' ? guidance[err.code] ?? err.message : undefined;

      return NextResponse.json(
        {
          error: 'We could not save your complaint. Please try again, or call us on 07 3000 0000.',
          ...(detail ? { detail } : {}),
        },
        { status: 502 }
      );
    }

    console.error('complaint create failed', err);
    return NextResponse.json(
      { error: 'We could not save your complaint. Please try again shortly.' },
      { status: 502 }
    );
  }
}
