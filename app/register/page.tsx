import type { Metadata } from 'next';
import PatientRegistrationForm from '@/components/PatientRegistrationForm';

export const metadata: Metadata = {
  title: 'Register as a patient | Silverline Health',
  description: 'Join Silverline Health as a new patient across our three Brisbane clinics.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ink">
          Register as a patient
        </h1>
        <p className="mt-3 leading-relaxed text-body">
          Complete this form and you will receive a patient number straight away. It takes about
          two minutes, and you can book an appointment as soon as it is done.
        </p>
      </header>

      <div
        role="note"
        className="mb-8 rounded-lg border-l-4 border-signal bg-wash p-4 text-sm text-ink"
      >
        <strong className="font-semibold">If this is a medical emergency, call 000.</strong>{' '}
        Registering here does not book an appointment and is not a way to get urgent care.
      </div>

      <div className="rounded-xl border border-line bg-card p-6">
        <PatientRegistrationForm />
      </div>

      <p className="mt-6 text-xs text-muted">
        Your information is handled in line with our privacy policy. If you would prefer to
        register over the phone, call us on 07 3000 0000 during business hours.
      </p>
    </div>
  );
}
