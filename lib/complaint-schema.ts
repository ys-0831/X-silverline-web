// lib/complaint-schema.ts
//
// EVERY assumption about your Salesforce schema lives in this file.
// If your org uses different API names, change them here and nowhere else.
//
// Run `npm run describe:complaint` to print your org's actual object and field
// API names, then correct the values below to match.

/** The custom object records are written to. */
export const COMPLAINT_OBJECT = process.env.SF_COMPLAINT_OBJECT ?? 'Complaint__c';

/**
 * Field returned to the user as their reference.
 *
 * Leave this null when `Name` is a writable Text field holding the complaint
 * title — echoing the user's own title back as a "reference number" is
 * meaningless, so the record Id is used instead. If you add an Auto Number
 * field (e.g. Reference__c, format CMP-{00000000}), put its API name here.
 */
export const COMPLAINT_REFERENCE_FIELD: string | null = null;

/** Maps internal field keys to Salesforce API names. */
export const F = {
  name: 'Name',
  details: 'Details__c',
  patient: 'Patient__c',
  priority: 'Priority__c',
  status: 'Status__c',
} as const;

/** Values written on every new record. */
export const DEFAULTS: Record<string, unknown> = {
  [F.status]: 'New',
  [F.priority]: 'Low',
};

/**
 * What Patient__c points at, and which field on that object holds the email.
 * Run the describe script and read the "references:" line under Patient__c to
 * confirm. If it references a custom object, change both values.
 */
export const PATIENT_LOOKUP = {
  object: 'Contact',
  emailField: 'Email',
} as const;

/** Field length limits. The standard Name field is Text(80). */
export const LIMITS = {
  subject: 80,
  subjectMin: 5,
  details: 32000,
  detailsMin: 20,
  email: 254,
  name: 120,
} as const;
