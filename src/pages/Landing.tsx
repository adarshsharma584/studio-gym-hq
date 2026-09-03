import { motion } from "framer-motion";
import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, CalendarCheck, Dumbbell, Flame, HeartPulse, Medal, MessageSquareText, Nut, Quote, ShieldCheck, Sparkles, Users, Waves, Zap } from "lucide-react";
import logo from "@/assets/logo.svg";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const SERVICES = [
  { icon: Flame, title: "Group Classes", text: "HIIT, spin, boxing and CrossFit WODs — 40+ sessions every week, all included in Pro and Elite plans." },
  { icon: Dumbbell, title: "Personal Training", text: "1-on-1 coaching with certified specialists who program around your body, your schedule and your goals." },
  { icon: Waves, title: "Recovery Zone", text: "Ice baths, sauna and sports massage to reset between sessions. Elite members get full access." },
  { icon: Nut, title: "Nutrition Coaching", text: "Structured eating plans and monthly body-composition reviews with our in-house nutrition team." },
];

const PLANS = [
  { name: "Essential", price: "1,999", period: "/month", features: ["Full gym floor access", "Locker & shower", "1 guest pass / month"], highlight: false },
  { name: "Pro", price: "3,499", period: "/month", features: ["Everything in Essential", "Unlimited group classes", "1 PT session / month", "Nutrition starter plan"], highlight: true },
  { name: "Elite", price: "5,499", period: "/month", features: ["Everything in Pro", "4 PT sessions / month", "Recovery zone access", "Priority class booking"], highlight: false },
];

const COACHES = ["Marcus Bennett", "Elena Vasquez", "Dev Anand", "Sarah Lindqvist"];
const REEL_CAPTIONS = ["Legs day finisher", "Deadlift setup", "Studio tour", "6-month transformation"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Pulse Athletics" width={32} height={32} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">
              Pulse <span className="text-emerald-400">Athletics</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <a href="#programs" className="transition-colors hover:text-zinc-100">Programs</a>
            <a href="#coaches" className="transition-colors hover:text-zinc-100">Coaches</a>
            <a href="#membership" className="transition-colors hover:text-zinc-100">Membership</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth?returnTo=/dashboard"
              className="hidden rounded-lg border border-white/10 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/25 hover:text-white sm:block"
            >
              Member sign in
            </Link>
            <Link
              to="/auth?returnTo=/dashboard"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300"
            >
              Open Dashboard
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(52,211,153,0.14) 0%, transparent 70%), radial-gradient(40% 40% at 85% 20%, rgba(52,211,153,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(70% 60% at 50% 30%, black, transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
              <Zap className="size-3.5" />
              Bengaluru's most disciplined training floor
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Train hard.
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">Recover smart.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
              Strength, conditioning, recovery and nutrition under one roof — coached by specialists who track your progress like it's their own.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth?returnTo=/dashboard"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 sm:w-auto"
              >
                Start your membership
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/auth?returnTo=/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-white/25 hover:text-white sm:w-auto"
              >
                Explore the club
              </Link>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            {...fadeUp}
            className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4"
          >
            {[
              { value: "500+", label: "Active members" },
              { value: "40+", label: "Classes / week" },
              { value: "8", label: "Elite coaches" },
              { value: "12,000m²", label: "Training space" },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-950 px-5 py-5 text-center">
                <p className="text-2xl font-bold tracking-tight text-emerald-300">{s.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="border-t border-white/5 bg-zinc-900/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">What you get</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything a serious athlete needs</h2>
            <p className="mt-4 text-zinc-400">
              One membership covers the floor, the classes, the recovery room and the guidance that ties it together.
            </p>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group rounded-2xl border border-white/10 bg-zinc-950 p-6 transition-colors hover:border-emerald-400/30"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300 transition-colors group-hover:bg-emerald-400 group-hover:text-zinc-950">
                  <s.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaches */}
      <section id="coaches" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">The coaching floor</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Trainers who actually watch the tape</h2>
            </div>
            <Link to="/auth?returnTo=/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300 hover:text-emerald-200">
              Meet the full team <ArrowUpRight className="size-4" />
            </Link>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COACHES.map((name, i) => (
              <motion.div
                key={name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-6"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/25 to-lime-400/10 text-sm font-bold text-emerald-200">
                  {name.split(" ").map((p) => p[0]).join("")}
                </div>
                <h3 className="mt-4 text-sm font-semibold">{name}</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {["Strength & powerlifting", "Yoga & mobility", "HIIT & conditioning", "Spin & endurance"][i]}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["CSCS", "NASM", "RYT", "CF-L1"].slice(0, 2).map((c) => (
                    <span key={c} className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400">{c}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reels strip */}
      <section className="border-y border-white/5 bg-zinc-900/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="flex items-center gap-3">
            <HeartPulse className="size-5 text-emerald-400" />
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">From the studio floor</h2>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-zinc-400">member reels</span>
          </motion.div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {REEL_CAPTIONS.map((caption, i) => (
              <motion.div
                key={caption}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group relative aspect-[9/14] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-950"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">{["🏋️", "💪", "🎥", "🔥"][i]}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 to-transparent p-3 pt-8">
                  <p className="text-xs font-medium">{caption}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Membership</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Pick your training plan</h2>
            <p className="mt-4 text-zinc-400">Every plan includes the full floor. Upgrade for classes, coaching and recovery.</p>
          </motion.div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <motion.div
                key={p.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={
                  p.highlight
                    ? "relative rounded-2xl border border-emerald-400/40 bg-zinc-950 p-6 shadow-[0_0_60px_-20px_rgba(52,211,153,0.35)]"
                    : "rounded-2xl border border-white/10 bg-zinc-950 p-6"
                }
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold text-zinc-950">
                    <Sparkles className="size-3" /> Most popular
                  </span>
                )}
                <h3 className="text-sm font-semibold text-zinc-300">{p.name}</h3>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  ₹{p.price}
                  <span className="text-sm font-normal text-zinc-500">{p.period}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                      <Medal className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth?returnTo=/dashboard"
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    p.highlight
                      ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
                      : "border border-white/10 text-zinc-200 hover:border-white/25"
                  }`}
                >
                  Join {p.name} <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / CTA */}
      <section className="border-t border-white/5 bg-zinc-900/40 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div {...fadeUp}>
            <Quote className="mx-auto size-8 text-emerald-400/60" />
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-zinc-200 sm:text-2xl">
              "Three months in and I've hit numbers I haven't seen since university athletics. The programming here is on another level."
            </p>
            <p className="mt-4 text-sm font-medium text-emerald-300">Rohan M. — Elite member, 14 months</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth?returnTo=/dashboard"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 sm:w-auto"
              >
                <CalendarCheck className="size-4" />
                Book a free trial session
              </Link>
              <Link
                to="/auth?returnTo=/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-white/25 hover:text-white sm:w-auto"
              >
                <ShieldCheck className="size-4" />
                Owner? Open the admin console
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Pulse Athletics" width={24} height={24} className="rounded-md" />
            <span className="text-sm text-zinc-400">
              Pulse <span className="text-zinc-200">Athletics</span> · 42 Stadium Road, Indiranagar, Bengaluru
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> Member portal</span>
            <span className="inline-flex items-center gap-1.5"><MessageSquareText className="size-3.5" /> Announcements</span>
            <Link to="/auth?returnTo=/dashboard" className="text-zinc-400 transition-colors hover:text-white">Admin login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}