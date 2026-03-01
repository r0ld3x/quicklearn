"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Check, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/razorpay";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function formatPrice(amount: number): string {
  if (amount === 0) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled) requestAnimationFrame(() => setIsLoggedIn(!!data?.user));
      })
      .catch(() => {
        if (!cancelled) requestAnimationFrame(() => setIsLoggedIn(false));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const planList = [
    {
      key: "FREE" as const,
      ...PLANS.FREE,
      popular: false,
      cta: "Get Started",
    },
    {
      key: "PRO" as const,
      ...PLANS.PRO,
      popular: true,
      cta: "Start Pro",
    },
    {
      key: "ENTERPRISE" as const,
      ...PLANS.ENTERPRISE,
      popular: false,
      cta: "Contact Sales",
    },
  ];

  return (
    <div className="dark min-h-screen bg-[#050816] text-white">
      <header className="border-b border-white/6 bg-[#050816]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Zap className="size-6 text-blue-400" />
            <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
              QuickLearn
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button size="sm" asChild className="bg-blue-600 text-white hover:bg-blue-500">
                <Link href="/dashboard" className="gap-2">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login" className="text-gray-300 hover:text-white">
                    Log In
                  </Link>
                </Button>
                <Button size="sm" asChild className="bg-blue-600 text-white hover:bg-blue-500">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          className="text-center"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Badge className="mb-4 border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            Pricing
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple,{" "}
            <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              transparent
            </span>{" "}
            pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Start free and upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid items-start gap-6 md:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ staggerChildren: 0.1 }}
        >
          {planList.map((plan) => (
            <motion.div
              key={plan.key}
              variants={fadeInUp}
              className={`relative ${plan.popular ? "md:-mt-2" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -inset-px rounded-2xl bg-linear-to-b from-blue-500 to-purple-500 opacity-80" />
              )}
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-8 ${
                  plan.popular
                    ? "border-transparent bg-[#0a0f1e]"
                    : "border-white/6 bg-white/2"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-linear-to-r from-blue-600 to-purple-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </Badge>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">
                    {formatPrice(plan.monthly)}
                  </span>
                  <span className="ml-1 text-gray-400">/month</span>
                  {plan.yearly > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      or {formatPrice(plan.yearly)}/year (save 17%)
                    </p>
                  )}
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-blue-400" />
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full ${
                    plan.popular
                      ? "border-0 bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <Link href={plan.key === "FREE" ? "/signup" : "/signup"}>
                    {plan.cta}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-12 text-center text-sm text-gray-500">
          All plans include a free tier. Upgrade from your{" "}
          <Link href="/settings" className="text-blue-400 hover:underline">
            dashboard
          </Link>{" "}
          when signed in.
        </p>
      </main>

      <footer className="mt-24 border-t border-white/6 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} QuickLearn. All rights reserved.{" "}
            <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
            {" · "}
            <Link href="/terms" className="hover:text-gray-300">Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
