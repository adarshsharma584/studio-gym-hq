import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  Medal,
  Megaphone,
  Nut,
  Play,
  Quote,
  ShieldCheck,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import logo from "@/assets/logo.svg";
import { formatDate } from "@/components/admin/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Display shapes that accept both live Convex docs and static fallbacks. */
type HeroBanner = { title: string; image?: string; ctaLabel?: string; ctaLink?: string; tagline?: string };
type ReelCard = { key: string; title: string; videoUrl?: string; cover?: string; durationSec?: number };
type GalleryCard = { key: string; title: string; image?: string };

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

// ---------------------------------------------------------------------------
// Static fallbacks — used while the live feed loads or when nothing has been
// published yet, so the homepage never looks broken.
// ---------------------------------------------------------------------------
const FALLBACK_BANNERS = [
  { title: "Train hard. Recover smart.", image: undefined, ctaLabel: "Start your membership", ctaLink: "/auth?returnTo=/dashboard", tagline: "Strength, conditioning, recovery and nutrition under one roof — coached by specialists who track your progress like it's their own." },
  { title: "Monsoon Challenge — 30% off new memberships", image: undefined, ctaLabel: "Claim offer", ctaLink: "/auth?returnTo=/dashboard", tagline: "Join before the end of the month and lock in a full year at a discounted rate." },
  { title: "PT Starter Pack — 4 sessions free", image: undefined, ctaLabel: "Book now", ctaLink: "/auth?returnTo=/dashboard", tagline: "New members get four 1-on-1 coaching sessions to build your programme." },
];

const FALLBACK_SERVICES = [
  { icon: Flame, title: "Group Classes", text: "HIIT, spin, boxing and CrossFit WODs — 40+ sessions every week, all included in Pro and Elite plans." },
  { icon: Dumbbell, title: "Personal Training", text: "1-on-1 coaching with certified specialists who program around your body, your schedule and your goals." },
  { icon: Waves, title: "Recovery Zone", text: "Ice baths, sauna and sports massage to reset between sessions. Elite members get full access." },
  { icon: Nut, title: "Nutrition Coaching", text: "Structured eating plans and monthly body-composition reviews with our in-house nutrition team." },
];

const FALLBACK_PLANS = [
  { name: "Essential", price: 1999, period: "/month", features: ["Full gym floor access", "Locker & shower", "1 guest pass / month"], popular: false },
  { name: "Pro", price: 3499, period: "/month", features: ["Everything in Essential", "Unlimited group classes", "1 PT session / month", "Nutrition starter plan"], popular: true },
  { name: "Elite", price: 5499, period: "/month", features: ["Everything in Pro", "4 PT sessions / month", "Recovery zone access", "Priority class booking"], popular: false },
];

const FALLBACK_COACHES = [
  { name: "Marcus Bennett", specialty: "Strength & powerlifting", certs: ["CSCS", "NSCA-CPT"] },
  { name: "Elena Vasquez", specialty: "Yoga & mobility", certs: ["RYT-500", "FRC"] },
  { name: "Dev Anand", specialty: "HIIT & conditioning", certs: ["ACE-CPT", "CF-L1"] },
  { name: "Sarah Lindqvist", specialty: "Spin & endurance", certs: ["NASM-CPT", "Spinning L3"] },
];

const FALLBACK_REELS = [
  { title: "60-second legs day finisher", emoji: "🏋️" },
  { title: "Trainer tip: deadlift setup", emoji: "💪" },
  { title: "Studio tour — see where you'll train", emoji: "🎥" },
  { title: "Member transformation: 6 months of consistency", emoji: "🔥" },
];

const FALLBACK_GALLERY = [
  { title: "Recovery zone", emoji: "🧊" },
  { title: "Spin studio", emoji: "🚴" },
  { title: "Strength floor", emoji: "🏋️" },
  { title: "Group studio", emoji: "🥊" },
];

const SERVICE_ICONS: Record<string, typeof Flame> = {
  "group-class": Flame,
  "personal-training": Dumbbell,
  recovery: Waves,
  nutrition: Nut,
  membership: Medal,
};

const REEL_EMOJIS = ["🏋️", "💪", "🎥", "🔥", "🧘", "🚴"];
const GALLERY_EMOJIS = ["🏋️", "🧊", "🚴", "🥊", "🔥", "💪"];

function CtaLink({ to, label, className, children }: { to?: string; label?: string; className?: string; children?: ReactNode }) {
  if (!to) return null;
  if (/^https?:\/\//.test(to)) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={className}>
        {children ?? label}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {children ?? label}
    </Link>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "border-red-400/30 bg-red-400/10 text-red-300",
  important: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  normal: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

export default function Landing() {
  const data = useQuery(api.content.getPublic);

  // Live content with static fallbacks while loading / not published yet
  const liveBanners = data?.banners ?? [];
  const banners =
    liveBanners.length > 0
      ? liveBanners.map((b) => ({
          title: b.title,
          image: b.image ?? undefined,
          ctaLabel: b.ctaLabel ?? undefined,
          ctaLink: b.ctaLink ?? undefined,
          tagline: undefined,
        }))
      : FALLBACK_BANNERS;

  const liveServices = data?.services ?? [];
  const services =
    liveServices.length > 0
      ? liveServices.slice(0, 8).map((s) => {
          const Icon = SERVICE_ICONS[s.category] ?? Flame;
          return { icon: Icon, title: s.name, text: s.description ?? "Train with our coaches." };
        })
      : FALLBACK_SERVICES;

  const liveTrainers = data?.trainers ?? [];
  const coaches =
    liveTrainers.length > 0
      ? liveTrainers.slice(0, 8).map((t) => ({
          name: t.name,
          specialty: t.specialties?.[0] ?? "Coach",
          certs: t.certifications?.slice(0, 2) ?? [],
        }))
      : FALLBACK_COACHES;

  const liveReels = data?.reels ?? [];
  const reels: ReelCard[] =
    liveReels.length > 0
      ? liveReels.map((r) => ({ key: r._id, title: r.title, videoUrl: r.videoUrl ?? undefined, cover: r.cover ?? undefined, durationSec: r.durationSec }))
      : FALLBACK_REELS.map((r, i) => ({ key: `fallback-${i}`, title: r.title }));

  const galleryPosts = (data?.posts ?? []).filter((p) => p.type === "gallery");
  const galleryItems: GalleryCard[] =
    galleryPosts.length > 0
      ? galleryPosts.map((p) => ({ key: p._id, title: p.title, image: p.image ?? undefined }))
      : FALLBACK_GALLERY.map((g, i) => ({ key: `fallback-${i}`, title: g.title }));

  const blogPosts = (data?.posts ?? []).filter((p) => p.type === "blog");

  const livePlans = data?.plans ?? [];
  const plans =
    livePlans.length > 0
      ? livePlans.slice(0, 3).map((p) => ({
          name: p.name,
          price: p.price,
          period:
            p.billingCycle === "monthly" ? "/month" : p.billingCycle === "quarterly" ? "/quarter" : p.billingCycle === "half-yearly" ? "/6 mo" : p.billingCycle === "annual" ? "/year" : "one-time",
          features: p.features ?? [],
          popular: p.popular,
        }))
      : FALLBACK_PLANS;

  const announcements = data?.announcements ?? [];
  const gym = data?.gym ?? null;

  // ---- Hero carousel -------------------------------------------------------
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 6500);
    return () => clearInterval(t);
  }, [paused, banners.length]);
  useEffect(() => {
    setSlide((s) => (s >= banners.length ? 0 : s));
  }, [banners.length]);

  // ---- Announcement ticker -------------------------------------------------
  const [annIdx, setAnnIdx] = useState(0);
  useEffect(() => {
    if (announcements.length <= 1) return;
    const t = setInterval(() => setAnnIdx((i) => (i + 1) % announcements.length), 5000);
    return () => clearInterval(t);
  }, [announcements.length]);

  // ---- Reel player + gallery lightbox --------------------------------------
  const [activeReel, setActiveReel] = useState<{ title: string; videoUrl: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ title: string; image: string } | null>(null);

  const active = banners[Math.min(slide, banners.length - 1)];
  const announcement = announcements.length > 0 ? announcements[annIdx % announcements.length] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Announcements ticker */}
      {announcement && (
        <div className="border-b border-white/5 bg-zinc-900/60">
          <AnimatePresence mode="wait">
            <motion.div
              key={announcement._id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-2 text-xs sm:px-6"
            >
              <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium capitalize", PRIORITY_STYLES[announcement.priority] ?? PRIORITY_STYLES.normal)}>
                <Megaphone className="size-3" /> {announcement.priority}
              </span>
              <span className="shrink-0 font-semibold text-zinc-200">{announcement.title}</span>
              <span className="truncate text-zinc-400">{announcement.body}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt={gym?.name ?? "Pulse Athletics"} width={32} height={32} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">
              {gym ? gym.name.split(" ")[0] : "Pulse"} <span className="text-emerald-400">{gym ? gym.name.split(" ").slice(1).join(" ") || "Athletics" : "Athletics"}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <a href="#programs" className="transition-colors hover:text-zinc-100">Programs</a>
            <a href="#coaches" className="transition-colors hover:text-zinc-100">Coaches</a>
            <a href="#reels" className="transition-colors hover:text-zinc-100">Reels</a>
            <a href="#gallery" className="transition-colors hover:text-zinc-100">Gallery</a>
            <a href="#membership" className="transition-colors hover:text-zinc-100">Membership</a>
            <Link to="/blogs" className="transition-colors hover:text-zinc-100">Blog</Link>
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

      {/* Hero — scheduled banner carousel */}
      <section className="relative overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {/* Slide backgrounds (crossfade) */}
        <div className="absolute inset-0">
          {banners.map((b, i) => (
            <div key={i} className={cn("absolute inset-0 transition-opacity duration-700", i === slide ? "opacity-100" : "opacity-0")}>
              {b.image ? (
                <img src={b.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(60% 50% at 50% 0%, rgba(52,211,153,0.14) 0%, transparent 70%), radial-gradient(40% 40% at 85% 20%, rgba(52,211,153,0.06) 0%, transparent 70%)",
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                      backgroundSize: "56px 56px",
                      maskImage: "radial-gradient(70% 60% at 50% 30%, black, transparent)",
                    }}
                  />
                </>
              )}
              {b.image && <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30" />}
            </div>
          ))}
        </div>

        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-center px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45 }}
              className="mx-auto max-w-3xl text-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
                <Zap className="size-3.5" />
                {liveBanners.length > 0 ? "Live on the floor" : "Bengaluru's most disciplined training floor"}
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                {active.title.split("—").map((part, i) => (
                  <span key={i}>
                    {i > 0 && <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">—</span>}
                    {part.trim()}
                    {i === 0 && active.title.includes("—") && <br />}
                  </span>
                ))}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-300/90 sm:text-lg">
                {active.tagline ?? "Strength, conditioning, recovery and nutrition under one roof — coached by specialists who track your progress like it's their own."}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {active.ctaLabel && active.ctaLink && (
                  <CtaLink
                    to={active.ctaLink}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 sm:w-auto"
                  >
                    <span>{active.ctaLabel}</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </CtaLink>
                )}
                <Link
                  to="/auth?returnTo=/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-white/25 hover:text-white sm:w-auto"
                >
                  Start your membership
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel controls */}
          {banners.length > 1 && (
            <>
              <div className="absolute inset-y-0 left-3 hidden items-center sm:flex">
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s - 1 + banners.length) % banners.length)}
                  className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-zinc-950/60 text-zinc-300 backdrop-blur transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="size-5" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-3 hidden items-center sm:flex">
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s + 1) % banners.length)}
                  className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-zinc-950/60 text-zinc-300 backdrop-blur transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
                  aria-label="Next banner"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
              <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlide(i)}
                    aria-label={`Go to banner ${i + 1}`}
                    className={cn("h-1.5 rounded-full transition-all", i === slide ? "w-7 bg-emerald-400" : "w-1.5 bg-white/30 hover:bg-white/50")}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 bg-zinc-950/70 backdrop-blur">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
            {[
              { value: "500+", label: "Active members" },
              { value: "40+", label: "Classes / week" },
              { value: String(liveTrainers.length > 0 ? liveTrainers.length : 8), label: "Elite coaches" },
              { value: "12,000m²", label: "Training space" },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-950/70 px-5 py-5 text-center">
                <p className="text-2xl font-bold tracking-tight text-emerald-300">{s.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
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
            {services.slice(0, 4).map((s, i) => (
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
            {coaches.slice(0, 4).map((c, i) => (
              <motion.div
                key={c.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-6 transition-colors hover:border-emerald-400/30"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/25 to-lime-400/10 text-sm font-bold text-emerald-200">
                  {c.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <h3 className="mt-4 text-sm font-semibold">{c.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">{c.specialty}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.certs.slice(0, 2).map((cert) => (
                    <span key={cert} className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {cert}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reels */}
      <section id="reels" className="border-y border-white/5 bg-zinc-900/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="flex items-center gap-3">
            <HeartPulse className="size-5 text-emerald-400" />
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">From the studio floor</h2>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-zinc-400">reels</span>
          </motion.div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {reels.slice(0, 8).map((r, i) => {
              const emoji = REEL_EMOJIS[i % REEL_EMOJIS.length];
              return (
                <motion.button
                  key={r.key}
                  type="button"
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  onClick={() => r.videoUrl && setActiveReel({ title: r.title, videoUrl: r.videoUrl })}
                  disabled={!r.videoUrl}
                  className={cn(
                    "group relative aspect-[9/14] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-950 text-left",
                    r.videoUrl && "cursor-pointer hover:border-emerald-400/40",
                  )}
                >
                  {r.cover ? (
                    <img src={r.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl transition-transform duration-500 group-hover:scale-110">{emoji}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
                  {r.videoUrl && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-11 items-center justify-center rounded-full bg-emerald-400/90 text-zinc-950 opacity-0 shadow-[0_0_30px_rgba(52,211,153,0.5)] transition-all duration-300 group-hover:opacity-100">
                        <Play className="size-5 fill-current" />
                      </span>
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 pt-8">
                    <p className="line-clamp-2 text-xs font-medium">{r.title}</p>
                    {r.durationSec ? (
                      <p className="mt-0.5 text-[10px] text-zinc-500">
                        {Math.floor(r.durationSec / 60)}:{String(r.durationSec % 60).padStart(2, "0")}
                      </p>
                    ) : null}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Inside the club</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Life at {gym?.name ?? "Pulse Athletics"}</h2>
            <p className="mt-4 text-zinc-400">Training floors, studio energy and member moments — straight from the club.</p>
          </motion.div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {galleryItems.slice(0, 8).map((g, i) => {
              const emoji = GALLERY_EMOJIS[i % GALLERY_EMOJIS.length];
              return (
                <motion.button
                  key={g.key}
                  type="button"
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  onClick={() => g.image && setLightbox({ title: g.title, image: g.image })}
                  disabled={!g.image}
                  className={cn(
                    "group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-950",
                    g.image && "cursor-pointer hover:border-emerald-400/40",
                  )}
                >
                  {g.image ? (
                    <img src={g.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl opacity-50">{emoji}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 to-transparent p-3 pt-10">
                    <p className="line-clamp-1 text-xs font-medium">{g.title}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="border-t border-white/5 bg-zinc-900/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Membership</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Pick your training plan</h2>
            <p className="mt-4 text-zinc-400">Every plan includes the full floor. Upgrade for classes, coaching and recovery.</p>
          </motion.div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.slice(0, 3).map((p, i) => (
              <motion.div
                key={p.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={
                  p.popular
                    ? "relative rounded-2xl border border-emerald-400/40 bg-zinc-950 p-6 shadow-[0_0_60px_-20px_rgba(52,211,153,0.35)]"
                    : "rounded-2xl border border-white/10 bg-zinc-950 p-6"
                }
              >
                {p.popular && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold text-zinc-950">
                    <Sparkles className="size-3" /> Most popular
                  </span>
                )}
                <h3 className="text-sm font-semibold text-zinc-300">{p.name}</h3>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  ₹{p.price.toLocaleString("en-IN")}
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
                    p.popular ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300" : "border border-white/10 text-zinc-200 hover:border-white/25"
                  }`}
                >
                  Join {p.name} <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview */}
      {blogPosts.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div {...fadeUp} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">The journal</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Latest from the coaches</h2>
              </div>
              <Link to="/blogs" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300 hover:text-emerald-200">
                Read all articles <ArrowUpRight className="size-4" />
              </Link>
            </motion.div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.slice(0, 3).map((p, i) => (
                <motion.div key={p._id} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.07 }}>
                  <Link
                    to={`/blogs/${p._id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 transition-colors hover:border-emerald-400/30"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl opacity-40">📖</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <CalendarDays className="size-3.5" /> {p.publishedAt ? formatDate(p.publishedAt) : "Just published"}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 transition-colors group-hover:text-emerald-300">{p.title}</h3>
                      {p.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{p.excerpt}</p>}
                      <p className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-emerald-300">
                        Read article <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

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
            <img src={logo} alt="" width={24} height={24} className="rounded-md" />
            <span className="text-sm text-zinc-400">
              {gym?.name ?? "Pulse Athletics"} · {gym ? `${gym.address}, ${gym.city}` : "42 Stadium Road, Indiranagar, Bengaluru"}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
            {gym?.phone && <span>{gym.phone}</span>}
            {gym?.email && <span>{gym.email}</span>}
            <Link to="/blogs" className="text-zinc-400 transition-colors hover:text-white">Blog</Link>
            <Link to="/auth?returnTo=/dashboard" className="text-zinc-400 transition-colors hover:text-white">Admin login</Link>
          </div>
        </div>
      </footer>

      {/* Reel player */}
      <Dialog open={!!activeReel} onOpenChange={(v) => !v && setActiveReel(null)}>
        <DialogContent className="max-w-3xl border-zinc-800 bg-zinc-950 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{activeReel?.title}</DialogTitle>
          </DialogHeader>
          {activeReel?.videoUrl && (
            <video src={activeReel.videoUrl} controls autoPlay playsInline className="mx-auto max-h-[65vh] w-full rounded-xl bg-black" />
          )}
        </DialogContent>
      </Dialog>

      {/* Gallery lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-4xl border-zinc-800 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{lightbox?.title}</DialogTitle>
          </DialogHeader>
          {lightbox && <img src={lightbox.image} alt={lightbox.title} className="max-h-[65vh] w-full rounded-xl object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}