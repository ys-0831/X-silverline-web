import type { Metadata } from 'next';
import ComplaintForm from '@/components/ComplaintForm';

export const metadata: Metadata = {
  title: 'Make a complaint | Silverline Health',
  description: 'Tell us about a problem with your care so we can investigate.',
  robots: { index: false, follow: false },
};

export default function ComplaintsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ink">
          Make a complaint
        </h1>
        <p className="mt-3 leading-relaxed text-body">
          We take every complaint seriously. Tell us what happened and we will investigate. You
          will receive a reference once you submit.
        </p>
      </header>

      <div
        role="note"
        className="mb-8 rounded-lg border-l-4 border-signal bg-wash p-4 text-sm text-ink"
      >
        <strong className="font-semibold">If this is a medical emergency, call 000.</strong> This
        form is not monitored continuously and is not a way to get urgent clinical help.
      </div>

      <div className="rounded-xl border border-line bg-card p-6">
        <ComplaintForm />
      </div>

      <p className="mt-6 text-xs text-muted">
        Your information is handled in line with our privacy policy. If you would prefer to speak
        to someone, call our patient liaison team on 07 3000 0000 during business hours.
      </p>
    </div>
  );
}
