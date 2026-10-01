import type { Metadata } from 'next';
import { Availability, PageHeader } from '@/components/SiteChrome';
import { CLINICS } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'Our Clinics | Silverline Health',
  description:
    'Silverline clinics at Chermside, South Bank and Toowong — hours, parking and contact details.',
};

export default function ClinicsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Three locations"
        title="Our Clinics"
        intro="Your records are shared across all three sites, so you can book wherever suits you on the day without repeating your history."
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="tabular space-y-px overflow-hidden rounded-lg border border-line bg-line">
          {CLINICS.map((clinic) => (
            <article key={clinic.slug} className="bg-card p-8">
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink">
                    {clinic.name}
                  </h2>

                  <address className="mt-3 not-italic leading-relaxed text-body">
                    {clinic.address}
                  </address>

                  <p className="mt-1">
                    <a
                      href={`tel:${clinic.phone.replace(/\s/g, '')}`}
                      className="font-[family-name:var(--font-geist-mono)] text-sm text-ink no-underline hover:underline"
                    >
                      {clinic.phone}
                    </a>
                  </p>

                  <p className="mt-4 max-w-md leading-relaxed text-body">{clinic.note}</p>
                  <p className="mt-4 text-sm text-muted">{clinic.parking}</p>

                  <div className="mt-6">
                    <Availability status={clinic.availability} next={clinic.nextAvailable} />
                  </div>
                </div>

                <div className="self-start rounded-lg bg-wash p-6">
                  <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-muted">
                    Opening hours
                  </p>
                  <dl className="mt-4 space-y-2">
                    {clinic.hours.map((row) => (
                      <div key={row.days} className="flex justify-between gap-4">
                        <dt className="text-sm text-body">{row.days}</dt>
                        <dd className="font-[family-name:var(--font-geist-mono)] text-sm text-ink">
                          {row.time}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
