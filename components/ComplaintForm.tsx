'use client';

import { useEffect, useRef, useState } from 'react';
import { LIMITS } from '@/lib/complaint-schema';
import {
  ComplaintInput,
  FieldErrors,
  hasErrors,
  validateComplaint,
} from '@/lib/complaint-validation';

const EMPTY: ComplaintInput = {
  subject: '',
  details: '',
  fullName: '',
  email: '',
  consent: false,
  website: '',
};

export default function ComplaintForm() {
  const [values, setValues] = useState<ComplaintInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  // Set in an effect rather than as a useRef initialiser: calling Date.now()
  // during render is impure, and the value is only needed once the user
  // interacts. Refs may be mutated in effects; state may not.
  const renderedAt = useRef<number | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  function set<K extends keyof ComplaintInput>(key: K, value: ComplaintInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = validateComplaint(values);
    if (hasErrors(found)) {
      setErrors(found);
      summaryRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
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
        <h2 className="text-lg font-semibold text-emerald-900">Complaint received</h2>
        <p className="mt-2 text-sm text-emerald-900">
          Your reference is{' '}
          <strong className="break-all font-mono text-base">{reference}</strong>. Please keep it
          for your records.
        </p>
        <p className="mt-3 text-sm text-emerald-800">
          A member of our patient liaison team will be in touch within five business days.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setReference(null);
            renderedAt.current = Date.now();
          }}
          className="mt-5 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-900"
        >
          Submit another complaint
        </button>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([, v]) => Boolean(v));

  const inputCls = (field: keyof ComplaintInput) =>
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

      {/* ---------- who ---------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-ink">
            Your name
          </label>
          <input
            id="fullName"
            type="text"
            maxLength={LIMITS.name}
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            className={inputCls('fullName')}
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1 text-xs text-red-700">{errors.fullName}</p>
          )}
        </div>

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
            aria-describedby="email-help"
            className={inputCls('email')}
          />
          <p id="email-help" className="mt-1 text-xs text-muted">
            We use this to find your patient record and to reply.
          </p>
          {errors.email && <p className="mt-1 text-xs text-red-700">{errors.email}</p>}
        </div>
      </div>

      {/* ---------- what ---------- */}
      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-medium text-ink">
          Title
        </label>
        <input
          id="subject"
          type="text"
          maxLength={LIMITS.subject}
          placeholder="A short summary, e.g. Long wait for test results"
          value={values.subject}
          onChange={(e) => set('subject', e.target.value)}
          aria-invalid={Boolean(errors.subject)}
          className={inputCls('subject')}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-red-700">{errors.subject ?? ''}</span>
          <span className="text-muted">
            {values.subject.length} / {LIMITS.subject}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="details" className="mb-1 block text-sm font-medium text-ink">
          What happened?
        </label>
        <p className="mb-2 text-xs text-body">
          Please include dates, which clinic you attended, staff involved if known, and what
          outcome you are hoping for.
        </p>
        <textarea
          id="details"
          rows={9}
          maxLength={LIMITS.details}
          value={values.details}
          onChange={(e) => set('details', e.target.value)}
          aria-invalid={Boolean(errors.details)}
          className={inputCls('details') + ' resize-y'}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-red-700">{errors.details ?? ''}</span>
          <span className="text-muted">
            {values.details.length.toLocaleString()} / {LIMITS.details.toLocaleString()}
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
            I understand that the information I provide will be stored in Silverline&apos;s
            records system and shared with the staff needed to investigate this complaint.
          </span>
        </label>
        {errors.consent && <p className="mt-2 text-xs text-red-700">{errors.consent}</p>}
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
      >
        {submitting ? 'Submitting…' : 'Submit complaint'}
      </button>
    </form>
  );
}
