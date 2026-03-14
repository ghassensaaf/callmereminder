import Link from "next/link";
import Image from "next/image";
import { Phone, Bell, Zap, Shield, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui";

export const metadata = {
  title: "Never Miss a Moment",
  description:
    "Smart phone call reminders that speak to you at the right time. Get AI-powered voice calls instead of silent notifications.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Dialcues"
                width={40}
                height={40}
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain flex-shrink-0"
                priority
              />
              <span className="font-display font-bold text-base sm:text-lg text-surface-900 dark:text-surface-50 truncate">
                Dialcues
              </span>
            </Link>
            <nav className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-sm">Get started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-surface-900 dark:text-surface-50 mb-6 leading-tight">
            Never miss a moment.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
              Get called, not notified.
            </span>
          </h1>
          <p className="text-xl text-surface-500 dark:text-surface-400 mb-10 max-w-2xl mx-auto">
            Smart phone call reminders that speak to you at the right time. No more
            silent notifications—our AI calls you when it matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Start free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-surface-200 dark:border-surface-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center text-surface-900 dark:text-surface-50 mb-16">
            Why Dialcues?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Phone className="h-8 w-8" />}
              title="Voice calls, not notifications"
              description="Get an actual phone call when your reminder is due. No more missed alerts buried in your notification center."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="AI-powered & smart"
              description="Our AI speaks naturally and adapts to your schedule. Set reminders in seconds with flexible time options."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Private & secure"
              description="Your reminders and data stay yours. We use industry-standard security to protect your information."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950/50 mb-6">
            <Bell className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-surface-900 dark:text-surface-50 mb-4">
            Ready to never forget again?
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mb-8">
            Join thousands who stay on track with voice call reminders.
          </p>
          <Link href="/signup">
            <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
              Create your free account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-surface-200 dark:border-surface-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-surface-500 dark:text-surface-400 text-sm">
            © {new Date().getFullYear()} Dialcues. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-surface-100/50 dark:bg-surface-900/50 border border-surface-200/50 dark:border-surface-800/50 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-display font-semibold text-surface-900 dark:text-surface-50 mb-2">
        {title}
      </h3>
      <p className="text-surface-500 dark:text-surface-400">{description}</p>
    </div>
  );
}
