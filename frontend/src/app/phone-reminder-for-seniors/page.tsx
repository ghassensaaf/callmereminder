import type { Metadata } from "next";
import { seoLandingPages } from "@/lib/seo-landing-pages";
import { SeoLandingTemplate } from "@/components/blog/SeoLandingTemplate";

const page = seoLandingPages.find((p) => p.slug === "phone-reminder-for-seniors")!;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://dialcues.com";

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: `${SITE}/${page.slug}` },
  openGraph: {
    title: page.metaTitle,
    description: page.metaDescription,
    url: `${SITE}/${page.slug}`,
  },
  twitter: {
    card: "summary_large_image",
    title: page.metaTitle,
    description: page.metaDescription,
  },
};

export default function Page() {
  return <SeoLandingTemplate page={page} />;
}
