import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Instagram,
  Mail,
  MapPin,
  Megaphone,
  Nut,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Waves,
  X,
} from "lucide-react";
import logo from "@/assets/logo.svg";
import { formatDate } from "@/components/admin/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Curated photography — real gym/training imagery with graceful fallbacks so
// the page never looks broken when an image is slow or unavailable. Admins
// can replace any of these by publishing their own banners/reels/posts.
// ---------------------------------------------------------------------------
const PHOTOS = {
  hero: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=70&w=1800",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=70&w=1800",
    "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&q=70&w=1800",
  ],
  coachMen: [
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=70&w=600",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=70&w=600",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=70&w=600",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=70&w=600",
  ],
  coachWomen: [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=70&w=600",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=70&w=600",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=70&w=600",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=70&w=600",
  ],
  reels: [
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=70&w=800", // featured: transformation energy
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=70&w=800",
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=70&w=800",
    "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&q=70&w=800",
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=70&w=800",
    "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=70&w=800",
  ],
  gallery: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=70&w=900",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=70&w=900",
    "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=70&w=900",
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=70&w=900",
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=70&w=900",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=70&w=900",
  ],
  results: [
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=70&w=800",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=70&w=800",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=70&w=800",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=70&w=800",
  ],
  avatars: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=70&w=200",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=70&w=200",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=70&w=200",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=70&w=200",
  ],
};

/** Image that degrades to a themed placeholder instead of a broken icon. */
function Photo({
  src,
  alt,
  emoji,
  className,
}: {
  src?: string;
  alt: string;
  emoji?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const key = src ?? "";
  useEffect(() => setFailed(false), [key]);
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-elevated to-base", className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-elevated to-base">
          {emoji ? (
            <span className="text-3xl opacity-50">{emoji}</span>
          ) : (
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brass">{children}</p>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.6rem]">
      {children}
    </h2>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

// ---------------------------------------------------------------------------
// Marketing copy / demo data (used until admins publish richer content)
// ---------------------------------------------------------------------------
const FALLBACK_PLANS = [
  {
    name: "Essential",
    price: 1999,
    period: "/month",
    bestFor: "Perfect if you train 2–3 days a week and want the full floor to yourself.",
    features: ["Full gym floor + cardio access", "Locker, towel & shower", "1 guest pass / month"],
    popular: false,
  },
  {
    name: "Pro",
    price: 3499,
    period: "/month",
    bestFor: "Best for 3+ workouts a week — unlimited classes keep every session varied.",
    features: ["Everything in Essential", "Unlimited group classes", "1 PT session / month", "Nutrition starter plan"],
    popular: true,
  },
  {
    name: "Elite",
    price: 5499,
    period: "/month",
    bestFor: "Best for serious athletes — daily coaching, recovery and zero guesswork.",
    features: ["Everything in Pro", "4 PT sessions / month", "Recovery zone access", "Priority class booking"],
    popular: false,
  },
];

const BENEFITS = [
  {
    icon: Flame,
    title: "Lose fat & build strength",
    text: "Structured HIIT, strength and conditioning blocks, periodised week to week so the scale and the mirror both move — with coaches tracking every session.",
    tag: "Included in Pro & Elite",
  },
  {
    icon: Dumbbell,
    title: "Train like an athlete",
    text: "1-on-1 coaching that fixes your form and programmes around your goals, injuries and schedule. Measurable progress every 4-week block.",
    tag: "Personal training available",
  },
  {
    icon: Waves,
    title: "Recover faster, come back stronger",
    text: "Ice baths, sauna and sports massage to reset between sessions — because the results happen between workouts, not just in them.",
    tag: "Elite members get full access",
  },
  {
    icon: Nut,
    title: "Eat to perform, not just to diet",
    text: "Structured eating plans and monthly body-composition reviews with our in-house nutrition team — no crash diets, just habits that stick.",
    tag: "Nutrition coaching included",
  },
];

const RESULTS = [
  { name: "Rohan S.", time: "9 months", result: "Deadlift 60 → 130 kg", photo: PHOTOS.results[0], emoji: "🏋️" },
  { name: "Priya N.", time: "5 months", result: "Lost 11 kg, kept the strength", photo: PHOTOS.results[1], emoji: "💪" },
  { name: "Ankit M.", time: "7 months", result: "Body fat 21% → 14%", photo: PHOTOS.results[2], emoji: "🔥" },
  { name: "Meera K.", time: "6 months", result: "First pull-up → 8 clean reps", photo: PHOTOS.results[3], emoji: "🏆" },
];

const TESTIMONIALS = [
  {
    quote: "I'd tried gyms before and quit by March. Here the coaches actually wrote me a plan and checked in every week — 12 kg down in 7 months.",
    name: "Arjun S.",
    meta: "Pro member · 8 months",
    photo: PHOTOS.avatars[0],
  },
  {
    quote: "Trained for my first half-marathon on their programming. Ran a 1:58 in Bengaluru heat — I still can't believe it.",
    name: "Neha K.",
    meta: "Elite member · 14 months",
    photo: PHOTOS.avatars[1],
  },
  {
    quote: "Seven years of desk-job back pain gone in three months of mobility work with Elena. My physio asked what changed.",
    name: "Vikram T.",
    meta: "Essential member · 5 months",
    photo: PHOTOS.avatars[2],
  },
  {
    quote: "I'd never touched a barbell. Dev had me deadlifting 80 kg with clean form in four months — form first, always.",
    name: "Sana M.",
    meta: "Pro member · 4 months",
    photo: PHOTOS.avatars[3],
  },
];

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Do I need experience to join?",
    a: "None at all. About half our members had never stepped into a gym before joining. Every new member gets an assessment session where a coach builds your starting programme, and all group classes are coach-led with scaled options for every level. No one is watching you — everyone is busy getting better.",
  },
  {
    q: "What's included in each plan?",
    a: (
      <>
        <strong className="text-cream">Essential</strong> — full gym floor, cardio and locker access.{" "}
        <strong className="text-cream">Pro</strong> — everything in Essential, plus unlimited group classes, one PT
        session a month and a nutrition starter plan. <strong className="text-cream">Elite</strong> — everything in Pro,
        plus four PT sessions a month, recovery zone access and priority class booking. You can upgrade (or downgrade)
        at any time — we adjust from your next billing date.
      </>
    ),
  },
  {
    q: "Can I freeze my membership?",
    a: "Yes. Freeze up to 30 days a year on annual plans and 14 days on monthly plans — for travel, injury or life getting in the way. Just tell the front desk or message us in the member app; your plan pauses and picks right back up where it left off.",
  },
  {
    q: "Is there a joining fee?",
    a: "No joining fee and no enrolment cost this month. When you book a trial and decide to join, the 30% offer locks in your first billing cycle — after that you're on month-to-month with no lock-in.",
  },
  {
    q: "What are your hours?",
    a: (
      <>
        Monday to Friday: 5:00 AM – 11:00 PM · Saturday: 6:00 AM – 10:00 PM · Sunday: 7:00 AM – 9:00 PM. Staffed (and
        coached) the whole time — classes start as early as 5:30 AM and run until 9:30 PM.
      </>
    ),
  },
];

const GOALS = [
  "Lose fat & get lean",
  "Build muscle & strength",
  "General fitness & energy",
  "Endurance & conditioning",
  "Yoga, mobility & recovery",
  "Sports performance",
  "Rehab & injury recovery",
  "Not sure yet — coach's call",
];

const DEFAULT_GYM = {
  name: "Pulse Athletics",
  tagline: "Bengaluru's most disciplined training floor",
  address: "42 Stadium Road, Indiranagar",
  city: "Bengaluru",
  phone: "+91 98765 43210",
  email: "hello@pulseathletics.fit",
  hours: { weekdays: "5:00 AM – 11:00 PM", saturday: "6:00 AM – 10:00 PM", sunday: "7:00 AM – 9:00 PM" },
};

const FALLBACK_BANNERS: { title: string; tagline?: string; image?: string }[] = [
  {
    title: "Join now and lock in 30% off your first year",
    tagline: "New memberships are 30% off this month — full floor, classes and coaching. No joining fee, no lock-in.",
  },
  {
    title: "New members get 4 free PT sessions",
    tagline: "A starter pack of four 1-on-1 sessions to build a programme that actually fits your life — included when you join.",
  },
  {
    title: "Student & corporate plans — 20% off",
    tagline: "Flexible memberships for students and teams, with class packs that work around your schedule.",
  },
];

const FALLBACK_REELS = [
  { title: "Member transformation — 6 months of consistency", emoji: "🔥" },
  { title: "60-second legs day finisher", emoji: "🏋️" },
  { title: "Trainer tip: deadlift setup", emoji: "💪" },
  { title: "Spin class energy — 30 seconds of pure burn", emoji: "🚴" },
  { title: "Studio tour — see where you'll train", emoji: "🎥" },
];

const FALLBACK_GALLERY = [
  { title: "Meet our new recovery zone", emoji: "🧊" },
  { title: "Elite members' Saturday brunch", emoji: "🥂" },
  { title: "Training floors & studio energy", emoji: "🏋️" },
  { title: "Life at Pulse", emoji: "💪" },
];

const PLAN_BEST_FOR: Record<string, string> = {
  Essential: "Perfect if you train 2–3 days a week and want the full floor.",
  Pro: "Best for 3+ workouts a week — unlimited classes keep it varied.",
  Elite: "Best for serious athletes who want daily coaching and recovery.",
  "Quarterly Pro": "Commit for a quarter and save two months of Pro pricing.",
  "Half-Yearly Elite": "Six months of Elite with two months free.",
  "Annual Elite": "The full year — two months free plus 30 freeze days.",
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Landing() {
  const data = useQuery(api.content.getPublic);
  const gym = data?.gym ?? null;
  const info = {
    name: gym?.name ?? DEFAULT_GYM.name,
    tagline: gym?.tagline ?? DEFAULT_GYM.tagline,
    address: gym?.address ?? DEFAULT_GYM.address,
    city: gym?.city ?? DEFAULT_GYM.city,
    phone: gym?.phone ?? DEFAULT_GYM.phone,
    email: gym?.email ?? DEFAULT_GYM.email,
    hours: gym?.hours ?? DEFAULT_GYM.hours,
  };

  // ---- Live content with graceful fallbacks ---------------------------------
  const liveBanners = data?.banners ?? [];
  const banners =
    liveBanners.length > 0
      ? liveBanners.map((b) => ({ title: b.title, tagline: undefined, image: b.image ?? undefined }))
      : FALLBACK_BANNERS;

  // Deterministic demo coaches pre-seed (admin data replaces these once published)
  const coachFallbacks = [
    { name: "Marcus Bennett", bio: "Former national-level powerlifter coaching strength athletes of every level for 10+ years.", specialties: ["Strength", "Powerlifting"], certs: ["CSCS", "NSCA-CPT"] },
    { name: "Elena Vasquez", bio: "Yoga & mobility specialist focused on recovery, breathwork and injury prevention.", specialties: ["Yoga", "Mobility"], certs: ["RYT-500", "FRC"] },
    { name: "Dev Anand", bio: "HIIT & functional coach who has trained MMA athletes and weekend warriors alike.", specialties: ["HIIT", "Boxing"], certs: ["ACE-CPT", "CF-L1"] },
    { name: "Sarah Lindqvist", bio: "Spin & endurance specialist — ex-pro cyclist who builds monster engines.", specialties: ["Spin", "Endurance"], certs: ["NASM-CPT", "Spinning L3"] },
  ];
  const FEMALE_TRAINERS = /vasquez|lindqvist|okafor|rahman|priya|meera/i;
  const maleNames = new Set<string>();
  const femaleNames = new Set<string>();
  const liveTrainers = data?.trainers ?? [];
  const allCoaches = (
    liveTrainers.length > 0 ? liveTrainers.slice(0, 8) : coachFallbacks
  ).map((t) => {
    const female = FEMALE_TRAINERS.test(t.name);
    const pool = female ? PHOTOS.coachWomen : PHOTOS.coachMen;
    const used = female ? femaleNames : maleNames;
    const next = used.size;
    used.add(t.name);
    const rawCerts =
      "certifications" in t ? (t.certifications ?? []) : "certs" in t ? (t.certs ?? []) : [];
    return {
      name: t.name,
      bio: t.bio,
      specialties: "specialties" in t ? (t.specialties ?? []) : [],
      certs: rawCerts.slice(0, 2),
      photo: pool[next % pool.length],
    };
  });

  const liveReels = data?.reels ?? [];
  const reelList = useMemo(() => {
    const items: {
      key: string;
      title: string;
      videoUrl?: string;
      cover?: string;
      durationSec?: number;
      emoji?: string;
    }[] =
      liveReels.length > 0
        ? liveReels.map((r) => ({
            key: r._id,
            title: r.title,
            videoUrl: r.videoUrl ?? undefined,
            cover: r.cover ?? undefined,
            durationSec: r.durationSec,
          }))
        : FALLBACK_REELS.map((r, i) => ({
            key: `fallback-${i}`,
            title: r.title,
            videoUrl: undefined,
            cover: undefined,
            durationSec: undefined,
            emoji: r.emoji,
          }));
    // demo photography covers each tile unless admin uploaded their own
    const withMedia = items.map((r, i) => ({ ...r, cover: r.cover ?? PHOTOS.reels[i % PHOTOS.reels.length] }));
    // lead with a member-transformation clip when one exists
    const lead = Math.max(
      0,
      withMedia.findIndex((r) => /transform|result|journey|consistency|before/i.test(r.title)),
    );
    return [withMedia[lead], ...withMedia.filter((_, i) => i !== lead)];
  }, [liveReels]);
  const isTransformReel = (title: string) => /transform|result|journey|consistency|before|month/i.test(title);

  const galleryPosts = (data?.posts ?? []).filter((p) => p.type === "gallery");
  const galleryItems = useMemo(() => {
    const items =
      galleryPosts.length > 0
        ? galleryPosts.map((p, i) => ({ key: p._id, title: p.title, image: p.image ?? undefined }))
        : FALLBACK_GALLERY.map((g, i) => ({ key: `fallback-${i}`, title: g.title, image: undefined }));
    return items.map((g, i) => ({ ...g, image: g.image ?? PHOTOS.gallery[i % PHOTOS.gallery.length] }));
  }, [galleryPosts]);

  const blogPosts = (data?.posts ?? []).filter((p) => p.type === "blog");

  const livePlans = data?.plans ?? [];
  const plans =
    livePlans.length > 0
      ? livePlans.slice(0, 3).map((p, i) => ({
          name: p.name,
          price: p.price,
          period:
            p.billingCycle === "monthly"
              ? "/month"
              : p.billingCycle === "quarterly"
                ? "/quarter"
                : p.billingCycle === "half-yearly"
                  ? "/6 mo"
                  : p.billingCycle === "annual"
                    ? "/year"
                    : "one-time",
          features: p.features ?? [],
          popular: p.popular,
          bestFor: PLAN_BEST_FOR[p.name] ?? p.description ?? ["Best for building a consistent habit.", "Best for 3+ workouts a week.", "Best for full coaching & recovery."][Math.min(i, 2)],
        }))
      : FALLBACK_PLANS;

  const announcements = (data?.announcements ?? []).filter((a) => a.audience !== "staff");

  // ---- State ---------------------------------------------------------------
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [annIdx, setAnnIdx] = useState(0);
  const [activeReel, setActiveReel] = useState<{ title: string; videoUrl?: string; cover?: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ title: string; image?: string } | null>(null);
  const [pref, setPref] = useState<{ coach?: string; plan?: string }>({});
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 6500);
    return () => clearInterval(t);
  }, [paused, banners.length]);
  useEffect(() => setSlide((s) => (s >= banners.length ? 0 : s)), [banners.length]);
  useEffect(() => {
    if (announcements.length <= 1) return;
    const t = setInterval(() => setAnnIdx((i) => (i + 1) % announcements.length), 5000);
    return () => clearInterval(t);
  }, [announcements.length]);
  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = banners[Math.min(slide, banners.length - 1)];
  const announcement = announcements.length > 0 ? announcements[annIdx % announcements.length] : null;

  const goTrial = (p: { coach?: string; plan?: string }) => {
    setPref(p);
    setTimeout(() => scrollToId("trial-booking"), 30);
  };

  return (
    <div className="min-h-screen bg-base pb-16 text-cream antialiased md:pb-0">
      {/* Announcement ticker */}
      {announcement && (
        <div className="border-b border-cream/10 bg-surface/80">
          <AnimatePresence mode="wait">
            <motion.div
              key={announcement._id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-2 text-xs sm:px-6"
            >
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cream/15 bg-cream/5 px-2.5 py-0.5 font-medium text-cream-dim">
                <Megaphone className="size-3 text-brass" /> Notice
              </span>
              <span className="shrink-0 font-semibold text-cream">{announcement.title}</span>
              <span className="hidden truncate text-cream-dim sm:block">{announcement.body}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-cream/10 bg-base/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <img src={logo} alt={info.name} width={32} height={32} className="rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">
              Pulse <span className="text-brass">Athletics</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-cream-dim lg:flex">
            <a href="#programs" className="transition-colors hover:text-cream">Programs</a>
            <a href="#coaches" className="transition-colors hover:text-cream">Coaches</a>
            <a href="#results" className="transition-colors hover:text-cream">Results</a>
            <a href="#membership" className="transition-colors hover:text-cream">Membership</a>
            <Link to="/blogs" className="transition-colors hover:text-cream">Journal</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth?returnTo=/dashboard"
              className="hidden rounded-lg border border-cream/15 px-3.5 py-2 text-sm font-medium text-cream/85 transition-colors hover:border-cream/40 hover:text-cream md:inline-flex"
            >
              Member login
            </Link>
            <a
              href="#trial-booking"
              onClick={() => goTrial({})}
              className="group inline-flex items-center gap-1.5 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-base transition-all hover:bg-ember/90 hover:shadow-[0_0_24px_-6px_rgba(255,107,74,0.55)]"
            >
              Claim Offer
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section
        id="top"
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Crossfading photographic backgrounds */}
        <div className="absolute inset-0">
          {banners.map((b, i) => (
            <div key={i} className={cn("absolute inset-0 transition-opacity duration-700", i === slide ? "opacity-100" : "opacity-0")}>
              <Photo src={b.image ?? PHOTOS.hero[i % PHOTOS.hero.length]} alt="" className="h-full w-full" emoji="🏋️" />
              <div className="absolute inset-0 bg-base/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-base via-base/55 to-base/40" />
              <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_20%,transparent_0%,rgba(12,10,9,0.55)_100%)]" />
            </div>
          ))}
        </div>

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 pb-32 pt-24 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45 }}
              className="mx-auto max-w-3xl text-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-base/60 px-3.5 py-1.5 text-xs font-medium text-cream/90 backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-ember" />
                </span>
                Open today · First class 5:30 AM · {info.city}
              </span>

              <h1 className="mt-7 text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                {active.title.split("—").map((part, i) => {
                  const line = part.trim();
                  const offer = line.match(/(\d+\s*%\s*off)/i);
                  const idx = offer?.index ?? -1;
                  const pre = idx > 0 ? line.slice(0, idx).trimEnd() : "";
                  const post = offer ? line.slice(idx + offer[0].length).trimStart() : "";
                  return (
                    <span key={i}>
                      {i > 0 && <span className="text-brass"> —</span>}
                      {pre && (
                        <>
                          {pre}{" "}
                        </>
                      )}
                      {offer && <span className="whitespace-nowrap text-ember">{offer[0]}</span>}
                      {post && (
                        <>
                          {" "}{post}
                        </>
                      )}
                      {!offer && line}
                      {i === 0 && active.title.includes("—") && <br />}
                    </span>
                  );
                })}
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-cream/85 sm:text-lg">
                {active.tagline ?? info.tagline}
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#trial-booking"
                  onClick={() => goTrial({})}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ember px-7 py-3.5 text-sm font-semibold text-base transition-all hover:bg-ember/90 hover:shadow-[0_0_32px_-6px_rgba(255,107,74,0.6)] sm:w-auto"
                >
                  Claim Offer
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#trial-booking"
                  onClick={() => goTrial({})}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cream/25 bg-base/50 px-7 py-3.5 text-sm font-semibold text-cream backdrop-blur transition-colors hover:border-ember/60 hover:text-ember sm:w-auto"
                >
                  <Play className="size-4" />
                  Book Free Trial Class
                </a>
              </div>

              {/* Trust microcopy */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-cream-dim">
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-brass text-brass" />
                    ))}
                  </span>
                  Rated 4.8/5 by 500+ members
                </span>
                <span className="hidden h-3 w-px bg-cream/20 sm:block" />
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-teal" /> No joining fee this month
                </span>
                <span className="hidden h-3 w-px bg-cream/20 sm:block" />
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-teal" /> Freeze or cancel anytime
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {banners.length > 1 && (
            <>
              <div className="absolute inset-y-0 left-3 hidden items-center lg:flex">
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s - 1 + banners.length) % banners.length)}
                  className="flex size-10 items-center justify-center rounded-full border border-cream/15 bg-base/60 text-cream/80 backdrop-blur transition-colors hover:border-brass/60 hover:text-brass"
                  aria-label="Previous offer"
                >
                  <ChevronLeft className="size-5" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-3 hidden items-center lg:flex">
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s + 1) % banners.length)}
                  className="flex size-10 items-center justify-center rounded-full border border-cream/15 bg-base/60 text-cream/80 backdrop-blur transition-colors hover:border-brass/60 hover:text-brass"
                  aria-label="Next offer"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
              <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlide(i)}
                    aria-label={`Show offer ${i + 1}`}
                    className={cn("h-1.5 rounded-full transition-all", i === slide ? "w-8 bg-brass" : "w-1.5 bg-cream/30 hover:bg-cream/60")}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-cream/10 bg-surface/60 backdrop-blur">
          <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { value: "500+", label: "Active members" },
              { value: "40+", label: "Classes every week" },
              { value: String(allCoaches.length), label: "Elite coaches" },
              { value: "200+", label: "Member transformations" },
              { value: "12,000 m²", label: "Training space" },
            ].map((s) => (
              <div key={s.label} className="border-b border-cream/10 px-4 py-5 text-center sm:border-r lg:border-b-0 lg:last:border-r-0">
                <p className="text-2xl font-bold tracking-tight text-brass">{s.value}</p>
                <p className="mt-1 text-xs text-cream-dim">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHAT YOU GET ================= */}
      <section id="programs" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>What you get</SectionEyebrow>
            <SectionTitle>Outcomes first. Everything else follows.</SectionTitle>
            <p className="mt-4 text-cream-dim">
              No crowded floors, no machines you have to figure out alone. One membership covers the training, the
              coaching and the recovery that turns visits into results.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group flex flex-col rounded-2xl border border-cream/10 bg-surface p-6 transition-all hover:-translate-y-1 hover:border-brass/40 hover:shadow-[0_16px_40px_-24px_rgba(201,151,58,0.35)]"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-brass/10 text-brass transition-colors group-hover:bg-brass group-hover:text-base">
                  <b.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-6 text-cream-dim">{b.text}</p>
                <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-brass/90">
                  <Check className="size-3.5 text-teal" /> {b.tag}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COACHES ================= */}
      <section id="coaches" className="scroll-mt-20 border-y border-cream/10 bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <SectionEyebrow>The coaching floor</SectionEyebrow>
              <SectionTitle>Coaches who watch the tape, not the clock</SectionTitle>
              <p className="mt-4 text-cream-dim">
                Every trainer is certified, every programme is tracked, and every session starts with your goal — not a
                generic circuit.
              </p>
            </div>
            <a
              href="#trial-booking"
              onClick={() => goTrial({})}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brass transition-colors hover:text-cream"
            >
              Get matched with a coach <ArrowRight className="size-4" />
            </a>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {allCoaches.slice(0, 4).map((c, i) => (
              <motion.div
                key={c.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group overflow-hidden rounded-2xl border border-cream/10 bg-surface transition-all hover:-translate-y-1 hover:border-brass/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Photo src={c.photo} alt={c.name} emoji="🏋️" className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-base/70 to-transparent opacity-70" />
                  <span className="absolute bottom-3 left-3 rounded-md bg-base/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brass backdrop-blur">
                    {c.certs.join(" · ")}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold tracking-tight">{c.name}</h3>
                  <p className="mt-0.5 text-xs font-medium text-brass/90">{c.specialties.join(" · ")}</p>
                  <p className="mt-2.5 line-clamp-3 text-[13px] leading-6 text-cream-dim">{c.bio}</p>
                  <a
                    href="#trial-booking"
                    onClick={() => goTrial({ coach: c.name })}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-cream/15 py-2 text-xs font-semibold text-cream transition-colors hover:border-ember/70 hover:bg-ember hover:text-base"
                  >
                    Book with {c.name.split(" ")[0]}
                    <ArrowRight className="size-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= REELS ================= */}
      <section id="reels" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <SectionEyebrow>From the studio floor</SectionEyebrow>
              <SectionTitle>Watch what actually happens here</SectionTitle>
              <p className="mt-4 text-cream-dim">
                Real training, real members, real sweat — transformation clips and coach tips straight from the floor.
              </p>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brass transition-colors hover:text-cream"
            >
              <Instagram className="size-4" /> @pulseathletics
            </a>
          </motion.div>

          {reelList.length === 0 ? null : (
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 [grid-auto-flow:dense]">
              {reelList.slice(0, 5).map((r, i) => {
                const isFeatured = i === 0;
                const isTransformation = isTransformReel(r.title);
                return (
                  <motion.button
                    key={r.key}
                    type="button"
                    {...fadeUp}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    onClick={() => (r.videoUrl ? setActiveReel({ title: r.title, videoUrl: r.videoUrl, cover: r.cover }) : setLightbox({ title: r.title, image: r.cover }))}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-cream/10 bg-surface text-left transition-all hover:-translate-y-0.5 hover:border-brass/60 hover:shadow-[0_18px_50px_-24px_rgba(201,151,58,0.4)]",
                      isFeatured
                        ? "col-span-2 row-span-2 aspect-[4/3] md:aspect-[9/14] lg:aspect-auto lg:min-h-[520px]"
                        : "aspect-[9/14]",
                    )}
                  >
                    <Photo src={r.cover} alt={r.title} emoji={r.emoji} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-base/95 via-base/25 to-transparent" />
                    {isFeatured && (
                      <>
                        <span className="absolute left-3 top-3 rounded-md border border-brass/30 bg-base/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brass backdrop-blur">
                          Member transformation
                        </span>
                        <span className="absolute inset-0 hidden items-center justify-center md:flex">
                          <span className="flex size-16 items-center justify-center rounded-full border border-cream/30 bg-base/50 text-cream opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_40px_-4px_rgba(201,151,58,0.55)]">
                            <Play className="size-7 fill-current" />
                          </span>
                        </span>
                      </>
                    )}
                    {!isFeatured && isTransformation && (
                      <span className="absolute left-3 top-3 rounded-md border border-brass/30 bg-base/85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brass backdrop-blur">
                        Transformation
                      </span>
                    )}
                    <span className={cn("absolute inset-0 flex items-center justify-center", isFeatured ? "md:hidden" : "")}>
                      <span className="flex size-10 items-center justify-center rounded-full bg-base/55 text-cream/90 opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100">
                        <Play className="size-4 fill-current" />
                      </span>
                    </span>
                    <div className={cn("absolute inset-x-0 bottom-0 p-4", isFeatured && "md:p-6")}>
                      <p className={cn("line-clamp-2 font-semibold", isFeatured ? "text-base md:text-lg md:leading-7" : "text-xs font-medium")}>
                        {r.title}
                      </p>
                      {r.durationSec && (
                        <p className="mt-1 text-[10px] text-cream-dim">
                          {Math.floor(r.durationSec / 60)}:{String(r.durationSec % 60).padStart(2, "0")} clip
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= GALLERY ================= */}
      <section id="gallery" className="scroll-mt-20 border-y border-cream/10 bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionEyebrow>Inside the club</SectionEyebrow>
            <SectionTitle>Life at Pulse Athletics</SectionTitle>
            <p className="mt-4 text-cream-dim">Training floors, studio energy and member moments — straight from the club floor.</p>
          </motion.div>
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {galleryItems.slice(0, 4).map((g, i) => (
              <motion.button
                key={g.key}
                type="button"
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                onClick={() => setLightbox({ title: g.title, image: g.image })}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-cream/10 bg-surface text-left transition-all hover:-translate-y-0.5 hover:border-brass/60"
              >
                <Photo src={g.image} alt={g.title} emoji="🏋️" className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base/95 to-transparent p-4 pt-12">
                  <p className="line-clamp-1 text-sm font-medium">{g.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TRIAL BOOKING FORM ================= */}
      <TrialSection pref={pref} setPref={setPref} />

      {/* ================= TRANSFORMATIONS ================= */}
      <section id="results" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Member results</SectionEyebrow>
            <SectionTitle>Before & after — in their words</SectionTitle>
            <p className="mt-4 text-cream-dim">
              Every body is different. Here's what consistent training at Pulse has done for our members over the last
              12 months.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RESULTS.map((r, i) => (
              <motion.div
                key={r.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group relative overflow-hidden rounded-2xl border border-cream/10 bg-surface transition-all hover:-translate-y-1 hover:border-brass/40"
              >
                <Photo src={r.photo} alt={`${r.name} — ${r.result}`} emoji={r.emoji} className="aspect-[4/5] transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-base via-base/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="inline-flex items-center gap-1 rounded-md border border-brass/30 bg-base/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brass backdrop-blur">
                    <Flame className="size-3" /> {r.time}
                  </span>
                  <p className="mt-2 text-sm font-semibold">{r.name}</p>
                  <p className="text-xs font-medium text-brass">{r.result}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-cream-dim/70">
            *Individual results vary — photos representative of training at Pulse Athletics.
          </p>
        </div>
      </section>

      {/* ================= MEMBERSHIP / PRICING ================= */}
      <section id="membership" className="scroll-mt-20 border-y border-cream/10 bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Membership</SectionEyebrow>
            <SectionTitle>Pick the plan that fits your life</SectionTitle>
            <p className="mt-4 text-cream-dim">Every plan includes the full floor. Upgrade for classes, coaching and recovery.</p>
          </motion.div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.slice(0, 3).map((p, i) => (
              <motion.div
                key={p.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={
                  p.popular
                    ? "relative flex flex-col rounded-2xl border border-brass/50 bg-surface p-6 shadow-[0_0_70px_-24px_rgba(201,151,58,0.45)] lg:-my-3 lg:py-8"
                    : "relative flex flex-col rounded-2xl border border-cream/10 bg-surface p-6"
                }
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brass px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-base">
                    <Sparkles className="size-3" /> Most popular
                  </span>
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wider text-cream-dim">{p.name}</h3>
                <p className="mt-3 text-4xl font-bold tracking-tight">
                  ₹{p.price.toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-cream-dim">{p.period}</span>
                </p>
                <p className="mt-3 text-[13px] leading-5 text-cream-dim">{p.bestFor}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-cream/85">
                      <Check className="mt-0.5 size-4 shrink-0 text-teal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#trial-booking"
                  onClick={() => goTrial({ plan: p.name })}
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    p.popular
                      ? "bg-ember text-base hover:bg-ember/90 hover:shadow-[0_0_28px_-6px_rgba(255,107,74,0.6)]"
                      : "border border-cream/20 text-cream hover:border-ember/70 hover:bg-ember/10 hover:text-ember"
                  }`}
                >
                  {p.popular ? "Claim the 30% offer" : "Start with a free trial"}
                  <ArrowRight className="size-4" />
                </a>
              </motion.div>
            ))}
          </div>
          <motion.p {...fadeUp} className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2 text-center text-[13px] text-cream-dim">
            <ShieldCheck className="size-4 shrink-0 text-teal" />
            Cancel or freeze anytime — no lock-in, no hidden fees. 7-day money-back guarantee on your first month.
          </motion.p>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Member stories</SectionEyebrow>
            <SectionTitle>Real members. Real numbers.</SectionTitle>
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-brass text-brass" />
                ))}
              </span>
              <span className="text-sm text-cream-dim">
                <span className="font-bold text-cream">4.8/5</span> from 300+ Google reviews
              </span>
            </div>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.figure
                key={t.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="flex flex-col rounded-2xl border border-cream/10 bg-surface p-6 transition-all hover:-translate-y-1 hover:border-brass/40"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-3.5 fill-brass text-brass" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-6 text-cream/90">"{t.quote}"</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <Photo src={t.photo} alt={t.name} className="size-10 shrink-0 rounded-full" emoji={t.name[0]} />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-[11px] text-cream-dim">{t.meta}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <FaqSection />

      {/* ================= LOCATION & HOURS ================= */}
      <LocationSection info={info} />

      {/* ================= JOURNAL ================= */}
      {blogPosts.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div {...fadeUp} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <SectionEyebrow>The journal</SectionEyebrow>
                <SectionTitle>Latest from the coaches</SectionTitle>
              </div>
              <Link to="/blogs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brass transition-colors hover:text-cream">
                Read all articles <ArrowRight className="size-4" />
              </Link>
            </motion.div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.slice(0, 3).map((p, i) => (
                <motion.div key={p._id} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.07 }}>
                  <Link
                    to={`/blogs/${p._id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cream/10 bg-surface transition-all hover:-translate-y-1 hover:border-brass/40"
                  >
                    <Photo src={p.image} alt={p.title} emoji="📖" className="aspect-[16/9] transition-transform duration-700 group-hover:scale-105" />
                    <div className="flex flex-1 flex-col p-5">
                      <p className="flex items-center gap-1.5 text-[11px] text-cream-dim">
                        <CalendarDays className="size-3.5" /> {p.publishedAt ? formatDate(p.publishedAt) : "Just published"}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 transition-colors group-hover:text-brass">
                        {p.title}
                      </h3>
                      {p.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-cream-dim">{p.excerpt}</p>}
                      <p className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-brass">
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

      {/* ================= FINAL CTA ================= */}
      <section className="border-t border-cream/10 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div {...fadeUp}>
            <SectionEyebrow>First session is on us</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Try a class, meet the coaches,
              <br />
              <span className="text-brass">then decide.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-cream-dim">
              Book your free trial today and lock in 30% off your first year — no joining fee, no pressure, no lock-in.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#trial-booking"
                onClick={() => goTrial({})}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ember px-8 py-3.5 text-sm font-semibold text-base transition-all hover:bg-ember/90 hover:shadow-[0_0_32px_-6px_rgba(255,107,74,0.6)] sm:w-auto"
              >
                <CalendarDays className="size-4" />
                Book Free Trial
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#membership"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cream/20 px-8 py-3.5 text-sm font-semibold text-cream transition-colors hover:border-ember/60 hover:text-ember sm:w-auto"
              >
                Compare plans
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-cream/10 bg-surface/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <img src={logo} alt={info.name} width={32} height={32} className="rounded-lg" />
              <span className="text-[15px] font-semibold tracking-tight">
                Pulse <span className="text-brass">Athletics</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-cream-dim">{info.tagline}.</p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex size-9 items-center justify-center rounded-lg border border-cream/15 text-cream-dim transition-colors hover:border-brass/50 hover:text-brass"
              >
                <Instagram className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cream/70">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-cream-dim">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brass" />
                <a
                  href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${info.address}, ${info.city}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-cream"
                >
                  {info.address}
                  <br />
                  {info.city}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-cream-dim">
                <Phone className="size-4 shrink-0 text-brass" />
                <a href={`tel:${info.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-cream">
                  {info.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-cream-dim">
                <Mail className="size-4 shrink-0 text-brass" />
                <a href={`mailto:${info.email}`} className="transition-colors hover:text-cream">
                  {info.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cream/70">Hours</h4>
            <ul className="mt-4 space-y-3 text-sm text-cream-dim">
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-brass" /> Mon–Fri: {info.hours.weekdays}
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-brass" /> Saturday: {info.hours.saturday}
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-brass" /> Sunday: {info.hours.sunday}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cream/70">Explore</h4>
            <ul className="mt-4 space-y-3 text-sm text-cream-dim">
              <li><a href="#programs" className="transition-colors hover:text-cream">Programs</a></li>
              <li><a href="#coaches" className="transition-colors hover:text-cream">Coaches</a></li>
              <li><a href="#results" className="transition-colors hover:text-cream">Member results</a></li>
              <li><a href="#membership" className="transition-colors hover:text-cream">Membership</a></li>
              <li><a href="#trial-booking" onClick={() => goTrial({})} className="font-medium text-brass transition-colors hover:text-ember">Book a free trial</a></li>
              <li><Link to="/blogs" className="transition-colors hover:text-cream">Journal</Link></li>
              <li><Link to="/auth?returnTo=/dashboard" className="transition-colors hover:text-cream">Staff / admin login</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-cream/10 py-6">
          <p className="mx-auto max-w-6xl px-4 text-center text-xs text-cream-dim sm:px-6">
            © {new Date().getFullYear()} {info.name}. All rights reserved. Strength training is addictive — proceed accordingly.
          </p>
        </div>
      </footer>

      {/* Mobile sticky trial bar */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-cream/10 bg-base/95 p-3 backdrop-blur md:hidden"
          >
            <div className="flex gap-2.5">
              <a
                href="#trial-booking"
                onClick={() => goTrial({})}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ember px-4 py-3.5 text-sm font-bold text-base shadow-[0_-4px_24px_-6px_rgba(255,107,74,0.5)]"
              >
                Book Free Trial — It's on us
                <ArrowRight className="size-4" />
              </a>
              <a
                href={`tel:${info.phone.replace(/\s/g, "")}`}
                aria-label="Call us"
                className="flex size-12 items-center justify-center rounded-xl border border-cream/20 text-cream"
              >
                <Phone className="size-5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reel / video player */}
      <Dialog open={!!activeReel} onOpenChange={(v) => !v && setActiveReel(null)}>
        <DialogContent className="max-w-3xl border-cream/15 bg-surface sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-cream">{activeReel?.title}</DialogTitle>
          </DialogHeader>
          {activeReel?.videoUrl ? (
            <video src={activeReel.videoUrl} controls autoPlay playsInline className="mx-auto max-h-[65vh] w-full rounded-xl bg-black" />
          ) : (
            activeReel?.cover && <img src={activeReel.cover} alt={activeReel.title} className="max-h-[65vh] w-full rounded-xl object-contain" />
          )}
        </DialogContent>
      </Dialog>

      {/* Photo lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-4xl border-cream/15 bg-surface">
          <DialogHeader>
            <DialogTitle className="text-cream">{lightbox?.title}</DialogTitle>
          </DialogHeader>
          {lightbox?.image && <img src={lightbox.image} alt={lightbox.title} className="max-h-[65vh] w-full rounded-xl object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trial booking form — the primary conversion point. Leads are stored via
// api.leads.submit so the front desk can follow up.
// ---------------------------------------------------------------------------
function TrialSection({
  pref,
  setPref,
}: {
  pref: { coach?: string; plan?: string };
  setPref: (p: { coach?: string; plan?: string }) => void;
}) {
  const submit = useMutation(api.leads.submit);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (pref.coach || pref.plan) setDone(false);
  }, [pref]);

  const hasPref = Boolean(pref.coach || pref.plan);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setError(null);
    setSending(true);
    try {
      await submit({ name, phone, goal, coachName: pref.coach, planName: pref.plan, source: "homepage-trial" });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="trial-booking" className="scroll-mt-20 overflow-hidden border-y border-cream/10 bg-surface/40 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <motion.div {...fadeUp}>
          <SectionEyebrow>Free trial class</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Try a class on us.
            <br />
            <span className="text-brass">No commitment.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-cream-dim">
            Tell us a little about yourself and we'll call you back within a few hours to book your session with the
            right coach. The trial is completely free — you only decide after you've trained with us.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "One coached session matched to your goal — not a sales pitch",
              "Full gym-floor orientation & complimentary programme sheet",
              "No joining fee, no lock-in — 30% off if you join this month",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 text-sm text-cream/90">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal">
                  <Check className="size-3.5" />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-8 flex items-center gap-2 text-xs text-cream-dim">
            <Star className="size-4 fill-brass text-brass" />
            Rated 4.8/5 by 500+ members · We reply within 24 hours
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.55, delay: 0.1 }}>
          <div className="rounded-2xl border border-cream/10 bg-base p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)] sm:p-8">
            {done ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/15 text-teal">
                  <Check className="size-7" />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight">Request received!</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-cream-dim">
                  Thanks{name ? `, ${name.split(" ")[0]}` : ""} — our team will call you within 24 hours to book your
                  free {pref.plan ? `${pref.plan} trial` : "session"}
                  {pref.coach ? ` with ${pref.coach}` : ""}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDone(false);
                    setName("");
                    setPhone("");
                    setGoal("");
                    setPref({});
                  }}
                  className="mt-7 rounded-lg border border-cream/20 px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:border-ember/60 hover:text-ember"
                >
                  Book another trial
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Book your free trial</h3>
                  <p className="mt-1 text-xs text-cream-dim">Takes 20 seconds. No card, no spam.</p>
                </div>

                {hasPref && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brass/30 bg-brass/10 px-3.5 py-2.5 text-xs text-cream">
                    <span className="text-cream-dim">Booking as:</span>
                    {pref.plan && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-base/70 px-2 py-1 font-semibold text-brass">
                        {pref.plan} plan
                      </span>
                    )}
                    {pref.coach && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-base/70 px-2 py-1 font-semibold text-brass">
                        Coach {pref.coach}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPref({})}
                      className="ml-auto inline-flex items-center gap-1 text-cream-dim transition-colors hover:text-cream"
                      aria-label="Clear selection"
                    >
                      <X className="size-3.5" /> Clear
                    </button>
                  </div>
                )}

                <Field label="Your name">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aditi Sharma"
                    autoComplete="name"
                    className="w-full rounded-lg border border-cream/15 bg-surface px-3.5 py-2.5 text-sm text-cream placeholder:text-cream-dim/60 focus:border-ember/70 focus:outline-none focus:ring-2 focus:ring-ember/25"
                  />
                </Field>

                <Field label="Phone number">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98XXXXXX00"
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full rounded-lg border border-cream/15 bg-surface px-3.5 py-2.5 text-sm text-cream placeholder:text-cream-dim/60 focus:border-ember/70 focus:outline-none focus:ring-2 focus:ring-ember/25"
                  />
                </Field>

                <Field label="Preferred class / goal">
                  <div className="relative">
                    <select
                      required
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className={cn(
                        "w-full appearance-none rounded-lg border border-cream/15 bg-surface px-3.5 py-2.5 text-sm focus:border-ember/70 focus:outline-none focus:ring-2 focus:ring-ember/25",
                        goal ? "text-cream" : "text-cream-dim/60",
                      )}
                    >
                      <option value="" disabled>
                        Pick what you're training for…
                      </option>
                      {GOALS.map((g) => (
                        <option key={g} value={g} className="bg-surface text-cream">
                          {g}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-cream-dim" />
                  </div>
                </Field>

                {error && (
                  <p className="rounded-lg border border-ember/30 bg-ember/10 px-3.5 py-2.5 text-xs text-ember">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ember px-5 py-3.5 text-sm font-bold text-base transition-all hover:bg-ember/90 hover:shadow-[0_0_32px_-6px_rgba(255,107,74,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Booking…" : "Book my free trial"}
                  {!sending && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
                </button>

                <p className="text-center text-[11px] text-cream-dim/80">
                  By booking you agree to be contacted by phone/WhatsApp about your trial.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-dim">{label}</span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// FAQ accordion
// ---------------------------------------------------------------------------
function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t border-cream/10 bg-surface/40 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center">
          <SectionEyebrow>Good questions</SectionEyebrow>
          <SectionTitle>Everything people ask before their first class</SectionTitle>
        </motion.div>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={f.q}
                {...fadeUp}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-surface transition-colors",
                  isOpen ? "border-brass/40" : "border-cream/10 hover:border-cream/25",
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                >
                  <span className="text-[15px] font-semibold tracking-tight sm:text-base">{f.q}</span>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border transition-all",
                      isOpen ? "rotate-180 border-brass/50 bg-brass/10 text-brass" : "border-cream/20 text-cream-dim",
                    )}
                  >
                    <ChevronDown className="size-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <p className="px-5 pb-5 text-sm leading-7 text-cream-dim sm:px-6 sm:pb-6">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-10 text-center text-sm text-cream-dim">
          Still curious? Call us at{" "}
          <a href={`tel:+919876543210`} className="font-semibold text-brass transition-colors hover:text-cream">
            +91 98765 43210
          </a>{" "}
          or just drop in — the coffee machine is always on.
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Location, hours & map
// ---------------------------------------------------------------------------
function LocationSection({
  info,
}: {
  info: {
    name: string;
    tagline: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    hours: { weekdays: string; saturday: string; sunday: string };
  };
}) {
  const query = encodeURIComponent(`${info.address}, ${info.city}`);
  return (
    <section id="visit" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="max-w-2xl">
          <SectionEyebrow>Visit us</SectionEyebrow>
          <SectionTitle>Find us in the heart of Indiranagar</SectionTitle>
        </motion.div>
        <div className="mt-12 grid gap-6 lg:grid-cols-5">
          <motion.div {...fadeUp} className="rounded-2xl border border-cream/10 bg-surface p-6 sm:p-8 lg:col-span-2">
            <ul className="space-y-6">
              <li className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brass/10 text-brass">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">Address</p>
                  <p className="mt-1 text-sm leading-6 text-cream">
                    {info.address}
                    <br />
                    {info.city}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brass/10 text-brass">
                  <Clock className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">Hours</p>
                  <p className="mt-1 space-y-0.5 text-sm text-cream">
                    Mon–Fri: {info.hours.weekdays}
                    <br />
                    Saturday: {info.hours.saturday}
                    <br />
                    Sunday: {info.hours.sunday}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brass/10 text-brass">
                  <Phone className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">Call or WhatsApp</p>
                  <a
                    href={`tel:${info.phone.replace(/\s/g, "")}`}
                    className="mt-1 block text-sm font-semibold text-cream transition-colors hover:text-ember"
                  >
                    {info.phone}
                  </a>
                </div>
              </li>
            </ul>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-ember px-4 py-3 text-sm font-bold text-base transition-all hover:bg-ember/90 hover:shadow-[0_0_28px_-6px_rgba(255,107,74,0.6)]"
              >
                <MapPin className="size-4" /> Get Directions
              </a>
              <a
                href="#trial-booking"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cream/20 px-4 py-3 text-sm font-semibold text-cream transition-colors hover:border-ember/60 hover:text-ember"
              >
                Book a visit
              </a>
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.55, delay: 0.1 }} className="lg:col-span-3">
            <div className="h-full min-h-[320px] overflow-hidden rounded-2xl border border-cream/10 bg-surface">
              <iframe
                title={`Map to ${info.name}`}
                src={`https://maps.google.com/maps?q=${query}&z=15&output=embed`}
                className="h-full min-h-[320px] w-full grayscale-[35%] contrast-[1.05]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
