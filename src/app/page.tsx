"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Zap,
  FileText,
  Youtube,
  Mic,
  Link as LinkIcon,
  Layers,
  MessageSquare,
  HelpCircle,
  Brain,
  Check,
  Star,
  ArrowRight,
  Moon,
  Menu,
  X,
  Upload,
  Sparkles,
  BookOpen,
  Twitter,
  Github,
  Linkedin,
  ChevronRight,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: FileText,
    title: "PDF to Notes",
    description:
      "Upload any PDF and get structured summaries, key points, and actionable insights in seconds.",
    gradient: "from-orange-500 to-rose-500",
  },
  {
    icon: Youtube,
    title: "YouTube Summaries",
    description:
      "Paste a YouTube URL and receive a detailed breakdown with timestamps and key takeaways.",
    gradient: "from-red-500 to-pink-500",
  },
  {
    icon: Mic,
    title: "Audio Processing",
    description:
      "Upload lectures, meetings, or podcasts and get perfectly transcribed, structured notes.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: LinkIcon,
    title: "Web Links",
    description:
      "Drop any web link and extract essential information, filtered from ads and noise.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Layers,
    title: "AI Flashcards",
    description:
      "Automatically generate study flashcards from any content for effective spaced repetition.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: MessageSquare,
    title: "Chat with Docs",
    description:
      "Have interactive conversations with your documents. Ask questions, get precise answers.",
    gradient: "from-sky-500 to-blue-500",
  },
  {
    icon: HelpCircle,
    title: "Smart Q&A",
    description:
      "Generate comprehensive question and answer sets to test and deepen your understanding.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Brain,
    title: "Quiz Generation",
    description:
      "Create customized quizzes with multiple choice, true/false, and short answer questions.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload Your Content",
    description:
      "Drop a PDF, paste a YouTube link, upload audio, or share a web URL — we accept it all.",
    icon: Upload,
  },
  {
    number: "02",
    title: "AI Extracts Key Topics",
    description:
      "Our AI analyzes your content, identifies core concepts, and structures the information.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Learn Your Way",
    description:
      "Study with summaries, flashcards, quizzes, or chat with your documents interactively.",
    icon: BookOpen,
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "5 documents per month",
      "Basic summaries",
      "10 flashcards per doc",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description: "For serious learners",
    features: [
      "Unlimited documents",
      "Advanced AI summaries",
      "Unlimited flashcards",
      "Chat with documents",
      "Quiz generation",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$9.99",
    period: "/month",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Analytics dashboard",
      "Dedicated support",
      "SSO & SAML",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Medical Student",
    initials: "SC",
    quote:
      "QuickLearn cut my study prep time in half. I upload lecture recordings and get perfect flashcards. It's genuinely changed how I prepare for exams.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Marcus Johnson",
    role: "Software Engineer",
    initials: "MJ",
    quote:
      "I use it daily for technical documentation. The chat feature lets me ask questions about dense papers and get instant, accurate answers.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Content Creator",
    initials: "ER",
    quote:
      "As someone who consumes tons of YouTube content, the summary feature is a game-changer. I can review hours of video in minutes.",
    gradient: "from-orange-500 to-rose-500",
  },
];

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Resources: ["Documentation", "Help Center", "API Reference", "Status"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    setParticles(
      Array.from({ length: 50 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 5 + 4,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  return (
    <div className="dark min-h-screen bg-[#050816] text-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#050816]/80 backdrop-blur-2xl border-b border-white/6 shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-40 blur-lg transition-opacity group-hover:opacity-70" />
                <Zap className="relative size-6 text-blue-400" />
              </div>
              <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
                QuickLearn
              </span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Button variant="ghost" size="icon-sm" className="text-gray-400 hover:text-white">
                <Moon className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login" className="text-gray-300 hover:text-white">
                  Log In
                </Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="border-0 bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>

            <button
              className="p-2 text-gray-400 hover:text-white md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-white/6 bg-[#050816]/95 backdrop-blur-2xl md:hidden"
            >
              <div className="space-y-1 px-4 py-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex gap-3 pt-3">
                  <Button variant="outline" size="sm" asChild className="flex-1 border-white/20 text-gray-300">
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="flex-1 border-0 bg-linear-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-[#0a0e27] via-[#0d1540] to-[#050816]" />

        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-32 bottom-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[120px]"
            animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-600/10 blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background:
                  i % 3 === 0
                    ? "rgba(59, 130, 246, 0.4)"
                    : i % 3 === 1
                      ? "rgba(139, 92, 246, 0.4)"
                      : "rgba(6, 182, 212, 0.4)",
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.div
          className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="mb-6 border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-blue-300">
              <Sparkles className="mr-1.5 size-3.5" />
              AI-Powered Learning Platform
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            Learn Smarter,
            <br />
            <span className="bg-linear-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Not Harder
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Transform any content — PDFs, YouTube videos, audio recordings, and web
            pages — into structured knowledge with AI-powered summaries, flashcards,
            and interactive learning.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <Button
              size="lg"
              asChild
              className="h-12 border-0 bg-linear-to-r from-blue-600 to-purple-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-purple-500 hover:shadow-xl hover:shadow-blue-600/30"
            >
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/15 bg-white/3 px-8 text-base text-gray-200 backdrop-blur-sm hover:bg-white/8 hover:text-white"
              asChild
            >
              <a href="#how-it-works">
                See How It Works
                <ChevronRight className="ml-1 size-4" />
              </a>
            </Button>
          </motion.div>

          <motion.div
            className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500 sm:gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            {[
              { value: "50K+", label: "Active Learners" },
              { value: "1M+", label: "Documents Processed" },
              { value: "4.9", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg font-bold text-white sm:text-xl">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#050816] to-transparent" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 border-blue-500/20 bg-blue-500/10 text-blue-300">
                Features
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Everything You Need to{" "}
              <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Learn Faster
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-400"
            >
              Our AI-powered tools transform any content into structured, interactive
              learning materials.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative rounded-2xl border border-white/6 bg-white/2 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-white/12 hover:bg-white/5"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59, 130, 246, 0.06), transparent 40%)",
                  }}
                />
                <div className="relative">
                  <div
                    className={`mb-4 flex size-11 items-center justify-center rounded-xl bg-linear-to-br ${feature.gradient} shadow-lg`}
                    style={{
                      boxShadow: `0 8px 20px -4px rgba(0, 0, 0, 0.3)`,
                    }}
                  >
                    <feature.icon className="size-5 text-white" />
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative py-24 sm:py-32">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 border-purple-500/20 bg-purple-500/10 text-purple-300">
                How It Works
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Three Steps to{" "}
              <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mastery
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-400"
            >
              From raw content to structured knowledge in minutes, not hours.
            </motion.p>
          </motion.div>

          <div className="mt-20">
            <div className="relative grid gap-8 md:grid-cols-3 md:gap-6">
              <div className="absolute left-[16.67%] right-[16.67%] top-16 hidden h-px md:block">
                <div className="h-full w-full bg-linear-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50" />
                <div className="absolute -left-1 -top-1 size-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                <div className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
                <div className="absolute -right-1 -top-1 size-2.5 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50" />
              </div>

              {steps.map((step, idx) => (
                <motion.div
                  key={step.number}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, delay: idx * 0.2 },
                    },
                  }}
                  className="text-center"
                >
                  <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/8 bg-white/3">
                    <step.icon
                      className={`size-7 ${
                        idx === 0
                          ? "text-blue-400"
                          : idx === 1
                            ? "text-purple-400"
                            : "text-pink-400"
                      }`}
                    />
                  </div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                    Step {step.number}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-400">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                Pricing
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Simple,{" "}
              <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Transparent
              </span>{" "}
              Pricing
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-400"
            >
              Start free and upgrade when you&apos;re ready. No hidden fees, cancel
              anytime.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid items-start gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative ${plan.popular ? "md:-mt-4" : ""}`}
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
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="ml-1 text-gray-400">{plan.period}</span>
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
                        ? "border-0 bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-purple-500"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    <Link href="/signup">
                      {plan.cta}
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative py-24 sm:py-32">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 border-amber-500/20 bg-amber-500/10 text-amber-300">
                Testimonials
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Loved by{" "}
              <span className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Learners
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-4 max-w-2xl text-lg text-gray-400"
            >
              Join thousands of students and professionals who learn smarter every day.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="relative rounded-2xl border border-white/6 bg-white/2 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-white/12"
              >
                <Quote className="mb-4 size-8 text-white/6" />

                <div className="mb-5 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <p className="mb-6 text-sm leading-relaxed text-gray-300">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full bg-linear-to-br ${t.gradient} text-sm font-semibold text-white`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="relative overflow-hidden rounded-3xl border border-white/8 bg-linear-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 px-8 py-16 sm:px-16"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-600/20 blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-600/20 blur-[80px]" />
            </div>

            <div className="relative">
              <motion.h2
                variants={fadeInUp}
                className="text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Ready to Transform How You Learn?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="mx-auto mt-4 max-w-xl text-lg text-gray-400"
              >
                Join 50,000+ learners who are already studying smarter. Start for
                free — no credit card required.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button
                  size="lg"
                  asChild
                  className="h-12 border-0 bg-linear-to-r from-blue-600 to-purple-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-purple-500"
                >
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 bg-[#030712]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <Zap className="size-6 text-blue-400" />
                <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
                  QuickLearn
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                Transform any content into structured knowledge with AI-powered
                learning tools.
              </p>
              <div className="mt-6 flex gap-3">
                {[
                  { icon: Twitter, label: "Twitter" },
                  { icon: Github, label: "GitHub" },
                  { icon: Linkedin, label: "LinkedIn" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-lg border border-white/6 text-gray-500 transition-colors hover:border-white/12 hover:text-white"
                  >
                    <social.icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="mb-4 text-sm font-semibold text-white">{category}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-gray-500 transition-colors hover:text-gray-300"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/6 pt-8 sm:flex-row">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} QuickLearn. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-400">Privacy</a>
              <a href="#" className="hover:text-gray-400">Terms</a>
              <a href="#" className="hover:text-gray-400">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
