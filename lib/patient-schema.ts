// lib/patient-schema.ts
//
// Every assumption about the Patient__c object lives here.
// Run `npm run describe:patient` and correct these values against your own org
// before writing any other code.

export const PATIENT_OBJECT = process.env.SF_PATIENT_OBJECT ?? 'Patient__c';

/**
 * Patient_ID__c is an Auto Number field. It cannot be written, but it CAN be
 * read back after the insert — which makes it a real reference number to show
 * the patient, unlike a Name field they typed in themselves.
 */
export const PATIENT_REFERENCE_FIELD = 'Patient_ID__c';

/**
 * Field mapping.
 *
 * Note that `Name` is the standard record Name field, labelled "First Name" on
 * this object. The patient's given name IS the record name — there is no
 * separate First_Name__c.
 */
export const F = {
  firstName: 'Name',                   // Text(80)
  lastName: 'Last_Name__c',            // Text(50)
  dateOfBirth: 'Date_of_Birth__c',     // Date
  age: 'Age__c',                       // Number(18,0) — DERIVED, never collected
  email: 'Email__c',                   // Email
  phone: 'Phone__c',                   // Phone
  address: 'Address__c',               // Text Area(255)
  patientStatus: 'Status__c',  // Picklist — set by the org, not the patient
} as const;

/**
 * Written on every new record.
 *
 * This value MUST match the picklist definition in your org exactly, including
 * case and spacing. Run the describe script to confirm it — a mismatch on a
 * restricted picklist fails at insert with
 * INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST, which reads like a permissions error
 * and is not one.
 */
export const DEFAULTS: Record<string, unknown> = {
  [F.patientStatus]: 'New',
};

/** Salesforce field lengths. Enforced client-side and again on the server. */
export const LIMITS = {
  firstName: 80,
  lastName: 50,
  email: 254,
  phone: 40,
  address: 255,
} as const;

/** Plausible bounds for a registration, used to sanity-check the date of birth. */
export const AGE_BOUNDS = { min: 0, max: 130 } as const;
