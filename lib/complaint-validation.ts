// lib/complaint-validation.ts
//
// Shared by the form and the API route. The client copy gives fast feedback;
// the server copy is the one that protects the org.

import { LIMITS } from './complaint-schema';

export type ComplaintInput = {
  subject: string;        // → Name
  details: string;        // → Details__c
  fullName: string;       // used to match a patient record
  email: string;          // used to match a patient record
  consent: boolean;
  // anti-bot fields, never persisted
  website?: string;
  renderedAt?: number;
};

export type FieldErrors = Partial<Record<keyof ComplaintInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateComplaint(input: Partial<ComplaintInput>): FieldErrors {
  const e: FieldErrors = {};

  const subject = (input.subject ?? '').trim();
  if (!subject) {
    e.subject = 'Give your complaint a short title.';
  } else if (subject.length < LIMITS.subjectMin) {
    e.subject = 'Please write a slightly longer title.';
  } else if (subject.length > LIMITS.subject) {
    e.subject = `Titles must be ${LIMITS.subject} characters or fewer.`;
  }

  const details = (input.details ?? '').trim();
  if (!details) {
    e.details = 'Please describe what happened.';
  } else if (details.length < LIMITS.detailsMin) {
    e.details = `Please give us a little more detail (at least ${LIMITS.detailsMin} characters).`;
  } else if (details.length > LIMITS.details) {
    e.details = `Please keep this under ${LIMITS.details.toLocaleString()} characters.`;
  }

  const fullName = (input.fullName ?? '').trim();
  if (!fullName) {
    e.fullName = 'Please enter your name.';
  } else if (fullName.length > LIMITS.name) {
    e.fullName = `Name must be ${LIMITS.name} characters or fewer.`;
  }

  const email = (input.email ?? '').trim();
  if (!email) {
    e.email = 'An email address is needed so we can respond.';
  } else if (!EMAIL_RE.test(email)) {
    e.email = 'Enter a valid email address.';
  } else if (email.length > LIMITS.email) {
    e.email = 'That email address is too long.';
  }

  if (input.consent !== true) {
    e.consent = 'Please confirm you understand how this information will be used.';
  }

  return e;
}

export function hasErrors(e: FieldErrors): boolean {
  return Object.keys(e).length > 0;
}

/**
 * Cheap bot deterrence. Returns true when the submission looks automated;
 * callers should respond with a plausible success so scripts get no signal.
 */
export function looksAutomated(input: Partial<ComplaintInput>): boolean {
  if ((input.website ?? '').trim() !== '') return true;
  const rendered = Number(input.renderedAt);
  if (Number.isFinite(rendered) && Date.now() - rendered < 3000) return true;
  return false;
}
