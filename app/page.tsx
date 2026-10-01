import Link from 'next/link';
import { Availability } from '@/components/SiteChrome';
import { CLINICS, NEW_PATIENT_FACTS, SERVICES } from '@/lib/site-data';

export default function Home() {
  return (
    <>
      {/* Hero. The question patients actually arrive with is "when can I be
          seen" — most practice sites bury it behind a stock photo. */}
      <section className="border-b border-line bg-wash">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-muted">
            General practice · Brisbane
          </p>
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            When can I be seen?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">
            Most practice websites make you ring to find out. Here is what is actually available
            across our three clinics right now.
          </p>

          <div className="tabular mt-10 divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
            {CLINICS.map((clinic) => (
              <Link
                key={clinic.slug}
                href="/clinics"
                className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 no-underline transition-colors hover:bg-wash"
              >
                <span className="min-w-[9rem] text-sm font-medium text-ink">{clinic.suburb}</span>
                <Availability status={clinic.availability} next={clinic.nextAvailable} />
                <span aria-hidden="true" className="ml-auto hidden text-muted sm:inline">
                  →
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted">
            Availability shown is indicative. Ring the clinic to confirm, or ask the assistant in
            the corner of this page.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ink">
            What we do
          </h2>
          <Link href="/services" className="text-sm text-brand no-underline hover:underline">
            All services →
          </Link>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              href="/services"
              className="bg-card p-6 no-underline transition-colors hover:bg-wash"
            >
              <h3 className="text-base font-medium text-ink">{service.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">{service.summary}</p>
              <p className="mt-4 font-[family-name:var(--font-geist-mono)] text-xs text-muted">
                {service.duration}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-wash">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-ink">
              New patients
            </h2>
            <p className="mt-4 leading-relaxed text-body">
              We are accepting new patients at all three clinics. Bring your Medicare card, any
              concession cards, and a list of medications you currently take. If you are
              transferring from another practice, we can request your records for you.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 self-start">
            {NEW_PATIENT_FACTS.map((row) => (
              <div key={row.term}>
                <dt className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-muted">
                  {row.term}
                </dt>
                <dd className="mt-1 text-sm text-ink">{row.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
