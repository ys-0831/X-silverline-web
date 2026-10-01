import Link from 'next/link';
import { CLINICS, NAV } from '@/lib/site-data';

/**
 * Availability status. The dot never carries meaning alone — the label always
 * states the status in words, so it works without colour vision.
 */
export function Availability({
  status,
  next,
}: {
  status: 'open' | 'limited' | 'full';
  next: string;
}) {
  const tone = {
    open: { dot: 'bg-brand', label: 'Appointments available' },
    limited: { dot: 'bg-signal', label: 'Limited availability' },
    full: { dot: 'bg-muted', label: 'Booked out this week' },
  }[status];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex items-center gap-2 text-xs text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
        {tone.label}
      </span>
      <span className="font-[family-name:var(--font-geist-mono)] text-xs text-ink">{next}</span>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="border-b border-line bg-wash">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-muted">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-body">{intro}</p>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-wash">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
              Silverline Health
            </p>
            <p className="mt-2 text-sm leading-relaxed text-body">
              General practice across three Brisbane locations.
            </p>
            <p className="mt-4 font-[family-name:var(--font-geist-mono)] text-sm text-ink">
              07 3000 0000
            </p>
          </div>

          <div>
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-muted">
              Pages
            </p>
            <ul className="mt-3 space-y-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-body no-underline hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-muted">
              Clinics
            </p>
            <ul className="mt-3 space-y-2">
              {CLINICS.map((c) => (
                <li key={c.slug} className="text-sm text-body">
                  {c.suburb}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-muted">
              Feedback
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/complaints" className="text-sm text-body no-underline hover:text-ink">
                  Make a complaint
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="text-xs text-muted">
            In an emergency call 000. For urgent advice after hours, call 13 HEALTH on 13 43 25 84.
          </p>
          <p className="mt-2 text-xs text-muted">
            Demonstration site built for teaching purposes. Silverline Health is not a real medical
            practice, and every clinic, practitioner and appointment time shown here is fictional.
          </p>
        </div>
      </div>
    </footer>
  );
}
