import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "QuickLearn Privacy Policy – how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Zap className="size-5 text-primary" />
            QuickLearn
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              QuickLearn (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy. This Privacy Policy
              explains how we collect, use, store, and protect your information when you use our learning platform
              and related services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We collect information you provide directly (such as name, email address, and content you upload),
              information from your use of the Service (such as usage data and device information), and cookies or
              similar technologies where applicable. We use this to operate the Service, improve it, and communicate
              with you.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We use your information to provide, maintain, and improve the Service; to process your content and
              generate summaries, flashcards, and quizzes; to authenticate you and manage your account; to send
              transactional messages (e.g. verification codes); and to comply with legal obligations. We may use
              aggregated, non-personally identifiable data for analytics and product improvement.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">4. Data Storage and Security</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Your data is stored on secure servers. We use industry-standard measures to protect your information
              from unauthorized access, alteration, or destruction. Content you upload is processed to provide the
              Service and is retained in accordance with our data retention practices.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">5. Sharing and Disclosure</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share data with service providers that help us operate
              the Service (e.g. hosting, analytics, AI providers), under strict confidentiality and data-processing
              terms. We may disclose information if required by law or to protect our rights and safety.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              Depending on your location, you may have the right to access, correct, delete, or export your personal
              data, or to object to or restrict certain processing. You can update your profile in the app and contact
              us for other requests. You may also have the right to lodge a complaint with a supervisory authority.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">7. Cookies and Similar Technologies</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We use cookies and similar technologies for session management, security, and to improve the Service.
              You can control cookie settings through your browser; some features may not work correctly if cookies
              are disabled.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">8. Children</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              The Service is not intended for users under 13 (or the applicable minimum age in your region). We do not
              knowingly collect personal information from children. If you believe we have collected such information,
              please contact us so we can delete it.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will post the updated policy and revise the
              &quot;Last updated&quot; date. Significant changes may be communicated via the Service or by email where
              appropriate.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold">10. Contact Us</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              For privacy-related questions or requests, contact us through the feedback or support options in the app,
              or at the contact details provided on our website.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            Return to QuickLearn
          </Link>
          {" · "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>
        </p>
      </main>
    </div>
  );
}
