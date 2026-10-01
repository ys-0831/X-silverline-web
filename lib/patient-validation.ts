// lib/patient-validation.ts
//
// Shared by the form and the API route. The client copy gives fast feedback;
// the server copy is the one that actually protects the org.

import { AGE_BOUNDS, LIMITS } from './patient-schema';

export type PatientInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD, straight from <input type="date">
  email: string;
  phone: string;
  address: string;
  consent: boolean;
  // anti-bot fields, never persisted
  website?: string;
  renderedAt?: number;
};

export type FieldErrors = Partial<Record<keyof PatientInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d\s-]{6,40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whole years between a date of birth and today.
 *
 * Age is derived, never collected. A number typed into a form is correct for at
 * most one year; a date of birth stays correct forever.
 */
export function ageFromDateOfBirth(dob: string, today = new Date()): number {
  const [y, m, d] = dob.split('-').map(Number);
  let age = today.getFullYear() - y;
  const monthNow = today.getMonth() + 1;
  const beforeBirthday = monthNow < m || (monthNow === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function validatePatient(input: Partial<PatientInput>): FieldErrors {
  const e: FieldErrors = {};

  const firstName = (input.firstName ?? '').trim();
  if (!firstName) e.firstName = 'Please enter your first name.';
  else if (firstName.length > LIMITS.firstName)
    e.firstName = `First name must be ${LIMITS.firstName} characters or fewer.`;

  const lastName = (input.lastName ?? '').trim();
  if (!lastName) e.lastName = 'Please enter your last name.';
  else if (lastName.length > LIMITS.lastName)
    e.lastName = `Last name must be ${LIMITS.lastName} characters or fewer.`;

  const dob = (input.dateOfBirth ?? '').trim();
  if (!dob) {
    e.dateOfBirth = 'Please enter your date of birth.';
  } else if (!DATE_RE.test(dob)) {
    e.dateOfBirth = 'Use the date picker to choose a date.';
  } else if (Number.isNaN(Date.parse(`${dob}T00:00:00`))) {
    e.dateOfBirth = 'That date is not valid.';
  } else {
    const age = ageFromDateOfBirth(dob);
    if (age < AGE_BOUNDS.min) e.dateOfBirth = 'The date of birth cannot be in the future.';
    else if (age > AGE_BOUNDS.max) e.dateOfBirth = 'Please check the year of birth.';
  }

  const email = (input.email ?? '').trim();
  if (!email) e.email = 'An email address is needed to confirm your registration.';
  else if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email address.';
  else if (email.length > LIMITS.email) e.email = 'That email address is too long.';

  const phone = (input.phone ?? '').trim();
  if (!phone) e.phone = 'Please enter a contact phone number.';
  else if (!PHONE_RE.test(phone)) e.phone = 'Enter a valid phone number.';

  const address = (input.address ?? '').trim();
  if (!address) e.address = 'Please enter your residential address.';
  else if (address.length > LIMITS.address)
    e.address = `Address must be ${LIMITS.address} characters or fewer.`;

  if (input.consent !== true)
    e.consent = 'Please confirm you understand how your information will be used.';

  return e;
}

export function hasErrors(e: FieldErrors): boolean {
  return Object.keys(e).length > 0;
}

/** Cheap bot deterrence: a hidden field a human never fills, plus a timing check. */
export function looksAutomated(input: Partial<PatientInput>): boolean {
  if ((input.website ?? '').trim() !== '') return true;
  const rendered = Number(input.renderedAt);
  if (Number.isFinite(rendered) && Date.now() - rendered < 3000) return true;
  return false;
}
