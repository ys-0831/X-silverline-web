// app/api/patients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULTS,
  F,
  PATIENT_OBJECT,
  PATIENT_REFERENCE_FIELD,
} from '@/lib/patient-schema';
import {
  PatientInput,
  ageFromDateOfBirth,
  hasErrors,
  looksAutomated,
  validatePatient,
} from '@/lib/patient-validation';
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
const MAX_PER_WINDOW = 3;

function throttled(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

/** Returns true if a patient with this email already exists. */
async function emailAlreadyRegistered(email: string): Promise<boolean> {
  // The email is format-validated before it reaches here; the quote escape is
  // defence in depth. Never interpolate unvalidated input into SOQL.
  const safe = email.replace(/'/g, "\\'");
  const rows = await soql<{ Id: string }>(
    `SELECT Id FROM ${PATIENT_OBJECT} WHERE ${F.email} = '${safe}' LIMIT 1`
  );
  return rows.length > 0;
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
      { error: 'Too many registrations from this connection. Please try again later.' },
      { status: 429 }
    );
  }

  let input: Partial<PatientInput>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  // Respond plausibly so automated submitters get no useful signal.
  if (looksAutomated(input)) {
    return NextResponse.json({ reference: 'received' }, { status: 201 });
  }

  const errors = validatePatient(input);
  if (hasErrors(errors)) {
    return NextResponse.json({ fieldErrors: errors }, { status: 422 });
  }

  const email = (input.email ?? '').trim().toLowerCase();
  const dob = (input.dateOfBirth ?? '').trim();

  // Duplicate check. Deliberately generic: confirming which email addresses are
  // already registered would disclose who is a patient of this practice.
  try {
    if (await emailAlreadyRegistered(email)) {
      return NextResponse.json(
        {
          error:
            'We could not complete this registration online. Please call us on 07 3000 0000 and we will help.',
        },
        { status: 409 }
      );
    }
  } catch (err) {
    // A failed lookup should not block a legitimate registration.
    console.error('duplicate check failed', err instanceof Error ? err.message : err);
  }

  const record: Record<string, unknown> = {
    ...DEFAULTS,
    [F.firstName]: (input.firstName ?? '').trim(),
    [F.lastName]: (input.lastName ?? '').trim(),
    [F.dateOfBirth]: dob,                       // Salesforce Date wants YYYY-MM-DD
    [F.age]: ageFromDateOfBirth(dob),           // derived, never taken from the form
    [F.email]: email,
    [F.phone]: (input.phone ?? '').trim(),
    [F.address]: (input.address ?? '').trim(),
  };

  // Triage_Status__c and Vitals_Status__c are deliberately absent. They are
  // clinical assessments made by staff, not something a patient self-reports.

  try {
    const id = await createRecord(PATIENT_OBJECT, record);

    // Patient_ID__c is an Auto Number, so it only exists after the insert.
    const created = await readRecord(PATIENT_OBJECT, id, [PATIENT_REFERENCE_FIELD]);
    const reference = (created?.[PATIENT_REFERENCE_FIELD] as string) ?? id;

    // Identifiers only. Name, date of birth, address and contact details are
    // personal information and must not reach application logs.
    console.log('patient registered', { id, reference });

    return NextResponse.json({ reference }, { status: 201 });
  } catch (err) {
    if (err instanceof SalesforceRestError) {
      console.error('patient create failed', err.status, err.code, err.errors);

      const guidance: Record<string, string> = {
        INVALID_TYPE: `Object "${PATIENT_OBJECT}" does not exist, or the integration user cannot access it.`,
        INVALID_FIELD: 'A field API name in lib/patient-schema.ts does not match the org.',
        REQUIRED_FIELD_MISSING: 'The object requires a field this form does not send.',
        INSUFFICIENT_ACCESS_OR_READONLY:
          'The integration user lacks Create on the object or Edit on a field. ' +
          'Note that Patient_ID__c is an Auto Number and must NOT be written.',
        INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST:
          'Patient_Status__c in DEFAULTS does not match the picklist values in Salesforce.',
        STRING_TOO_LONG: 'A value exceeded the field length defined in Salesforce.',
        INVALID_EMAIL_ADDRESS: 'Salesforce rejected the email format on Email__c.',
      };

      const detail =
        process.env.NODE_ENV === 'development' ? guidance[err.code] ?? err.message : undefined;

      return NextResponse.json(
        {
          error:
            'We could not complete your registration. Please try again, or call us on 07 3000 0000.',
          ...(detail ? { detail } : {}),
        },
        { status: 502 }
      );
    }

    console.error('patient create failed', err);
    return NextResponse.json(
      { error: 'We could not complete your registration. Please try again shortly.' },
      { status: 502 }
    );
  }
}
