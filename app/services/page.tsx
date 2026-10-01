import type { Metadata } from 'next';
import { PageHeader } from '@/components/SiteChrome';
import { SERVICES } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'Services | Silverline Health',
  description:
    'General practice, chronic disease management, preventive health, immunisation, mental health and telehealth.',
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="What we offer"
        title="Services"
        intro="Everything below is available at all three clinics unless noted otherwise. Billing arrangements are listed against each service, so there are no surprises at the front desk."
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-2">
          {SERVICES.map((service) => (
            <article key={service.slug} className="bg-card p-8">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink">
                {service.name}
              </h2>
              <p className="mt-3 leading-relaxed text-body">{service.summary}</p>

              <ul className="mt-6 space-y-2">
                {service.includes.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-body">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-2 border-t border-line pt-4">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <dt className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-muted">
                    Appointment
                  </dt>
                  <dd className="font-[family-name:var(--font-geist-mono)] text-xs text-ink">
                    {service.duration}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <dt className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-muted">
                    Billing
                  </dt>
                  <dd className="text-xs text-body">{service.billing}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
