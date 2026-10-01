'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LIMITS } from '@/lib/patient-schema';
import {
  PatientInput,
  FieldErrors,
  ageFromDateOfBirth,
  hasErrors,
  validatePatient,
} from '@/lib/patient-validation';

const EMPTY: PatientInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  address: '',
  consent: false,
  website: '',
};

export default function PatientRegistrationForm() {
  const [values, setValues] = useState<PatientInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Set in an effect, not as a useRef initialiser: calling Date.now() during
  // render is impure. Refs may be mutated in effects; state may not.
  const renderedAt = useRef<number | null>(null);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Shown back to the patient so they can catch a mistyped year themselves.
  const derivedAge = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dateOfBirth)) return null;
    const a = ageFromDateOfBirth(values.dateOfBirth);
    return a >= 0 && a <= 130 ? a : null;
  }, [values.dateOfBirth]);

  function set<K extends keyof PatientInput>(key: K, value: PatientInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = validatePatient(values);
    if (hasErrors(found)) {
      setErrors(found);
      summaryRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, renderedAt: renderedAt.current ?? Date.now() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 422 && data.fieldErrors) {
        setErrors(data.fieldErrors);
        summaryRef.current?.focus();
        return;
      }
      if (!res.ok) {
        setFormError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setReference(data.reference);
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------- success
  if (reference) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <h2 className="text-lg font-semibold text-emerald-900">You are registered</h2>
        <p className="mt-2 text-sm text-emerald-900">
          Your patient number is{' '}
          <strong className="font-mono text-base">{reference}</strong>. Bring it with you to
          your first appointment.
        </p>
        <p className="mt-3 text-sm text-emerald-800">
          Please bring your Medicare card and any concession cards. If you are transferring from
          another practice, we can request your records for you.
        </p>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([, v]) => Boolean(v));

  const inputCls = (field: keyof PatientInput) =>
    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 ' +
    (errors[field] ? 'border-red-400 bg-red-50' : 'border-line focus:border-brand');

  // ------------------------------------------------------------------ form
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4"
        >
          <p className="text-sm font-semibold text-red-900">
            Please correct the following before submitting:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
            {errorList.map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {formError && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {formError}
        </div>
      )}

      {/* honeypot */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => set('website', e.target.value)}
        />
      </div>

      {/* ---------- name ---------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-ink">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            maxLength={LIMITS.firstName}
            autoComplete="given-name"
            value={values.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            className={inputCls('firstName')}
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-700">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-ink">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            maxLength={LIMITS.lastName}
            autoComplete="family-name"
            value={values.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            aria-invalid={Boolean(errors.lastName)}
            className={inputCls('lastName')}
          />
          {errors.lastName && <p className="mt-1 text-xs text-red-700">{errors.lastName}</p>}
        </div>
      </div>

      {/* ---------- date of birth ---------- */}
      <div>
        <label htmlFor="dateOfBirth" className="mb-1 block text-sm font-medium text-ink">
          Date of birth
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="dateOfBirth"
            type="date"
            max={today}
            autoComplete="bday"
            value={values.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
            aria-invalid={Boolean(errors.dateOfBirth)}
            aria-describedby="dob-help"
            className={inputCls('dateOfBirth') + ' sm:max-w-[16rem]'}
          />
          {derivedAge !== null && (
            <span className="font-mono text-sm text-muted">Age {derivedAge}</span>
          )}
        </div>
        <p id="dob-help" className="mt-1 text-xs text-muted">
          We calculate your age from this, so it stays correct every year.
        </p>
        {errors.dateOfBirth && <p className="mt-1 text-xs text-red-700">{errors.dateOfBirth}</p>}
      </div>

      {/* ---------- contact ---------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Email address
          </label>
          <input
            id="email"
            type="email"
            maxLength={LIMITS.email}
            autoComplete="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            className={inputCls('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-700">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            maxLength={LIMITS.phone}
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            className={inputCls('phone')}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-700">{errors.phone}</p>}
        </div>
      </div>

      {/* ---------- address ---------- */}
      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium text-ink">
          Residential address
        </label>
        <textarea
          id="address"
          rows={3}
          maxLength={LIMITS.address}
          autoComplete="street-address"
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
          aria-invalid={Boolean(errors.address)}
          className={inputCls('address') + ' resize-y'}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-red-700">{errors.address ?? ''}</span>
          <span className="text-muted">
            {values.address.length} / {LIMITS.address}
          </span>
        </div>
      </div>

      {/* ---------- consent ---------- */}
      <fieldset className="rounded-lg border border-line bg-wash p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={values.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            className="mt-1"
          />
          <span className="text-sm text-body">
            I understand that the information I provide will be stored in Silverline&apos;s patient
            records system and used to provide my care.
          </span>
        </label>
        {errors.consent && <p className="mt-2 text-xs text-red-700">{errors.consent}</p>}
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
      >
        {submitting ? 'Registering…' : 'Register as a patient'}
      </button>
    </form>
  );
}
