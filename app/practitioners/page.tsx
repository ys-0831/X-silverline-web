import type { Metadata } from 'next';
import { PageHeader } from '@/components/SiteChrome';
import { PRACTITIONERS } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'Practitioners | Silverline Health',
  description: 'Meet the GPs and nursing staff at Silverline Health across our three Brisbane clinics.',
};

export default function PractitionersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Who you will see"
        title="Practitioners"
        intro="Seeing the same practitioner over time leads to better care, so we will always try to book you with your usual GP. Languages spoken are listed where an interpreter would otherwise be needed."
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 xl:grid-cols-3">
          {PRACTITIONERS.map((p) => (
            <article key={p.slug} className="flex flex-col bg-card p-7">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ink">
                {p.name}
              </h2>
              <p className="mt-1 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-muted">
                {p.credentials}
              </p>
              <p className="mt-3 text-sm text-brand">{p.role}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-body">{p.bio}</p>

              <dl className="mt-6 space-y-3 border-t border-line pt-4">
                <div>
                  <dt className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-muted">
                    Special interests
                  </dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.interests.map((interest) => (
                      <span key={interest} className="rounded-full bg-wash px-2.5 py-1 text-xs text-ink">
                        {interest}
                      </span>
                    ))}
                  </dd>
                </div>

                {[
                  { term: 'Clinics', detail: p.clinics.join(', ') },
                  { term: 'Languages', detail: p.languages.join(', ') },
                ].map((row) => (
                  <div key={row.term} className="flex flex-wrap items-baseline gap-x-3">
                    <dt className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-muted">
                      {row.term}
                    </dt>
                    <dd className="text-xs text-body">{row.detail}</dd>
                  </div>
                ))}

                <div className="flex flex-wrap items-baseline gap-x-3">
                  <dt className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-muted">
                    Next available
                  </dt>
                  <dd className="font-[family-name:var(--font-geist-mono)] text-xs text-ink">
                    {p.nextAvailable}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
