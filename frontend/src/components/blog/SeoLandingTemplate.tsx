import Link from "next/link";
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import { BlogHeader } from "./BlogHeader";

interface SeoLandingTemplateProps {
  page: SeoLandingPage;
}

export function SeoLandingTemplate({ page }: SeoLandingTemplateProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle,
    description: page.metaDescription,
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  };

  return (
    <>
      <BlogHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {/* Hero */}
        <section className="mb-16 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-surface-900 dark:text-surface-50 leading-tight">
            {page.heroHeadline}
          </h1>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto leading-relaxed">
            {page.heroSubheadline}
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
            >
              Get started free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Content sections */}
        <div className="space-y-12">
          {page.sections.map((section, i) => (
            <section key={i}>
              <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50 mb-4">
                {section.heading}
              </h2>
              <p className="text-surface-700 dark:text-surface-300 leading-relaxed text-[17px]">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        {/* FAQ */}
        {page.faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50 mb-8">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {page.faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-surface-200 dark:border-surface-800 p-5">
                  <dt className="font-semibold text-surface-900 dark:text-surface-100">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-surface-600 dark:text-surface-400 leading-relaxed text-[15px]">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* CTA */}
        <section className="mt-16 rounded-2xl border border-primary-200 dark:border-primary-900 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-950/40 dark:to-primary-900/20 p-10 text-center">
          <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {page.ctaHeadline}
          </h2>
          <p className="mt-3 text-surface-600 dark:text-surface-400 max-w-md mx-auto leading-relaxed">
            {page.ctaBody}
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
          >
            Try Dialcues free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
