import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { ROLES } from "./schema";
import { getSettings, mulberry32, pick, startOfDay, STAFF_ROLES } from "./lib";
import type { Id } from "./_generated/dataModel";
// (Id is used by member/trainer id arrays)

/** Emails that always receive Super Admin access when they sign in. */
const DEFAULT_OWNER_EMAILS = ["adarshsharma@gmail.com"];

// ---------------------------------------------------------------------------
// Demo dataset — realistic gym business data so every admin module has
// something meaningful to show. Idempotent: runs once, guarded by the
// presence of the settings document.
// ---------------------------------------------------------------------------

const MEMBER_NAMES = [
  "Aarav Sharma", "Priya Patel", "Rohan Mehta", "Sneha Iyer", "Arjun Nair",
  "Kavya Reddy", "Vikram Singh", "Ananya Bose", "Rahul Verma", "Isha Kapoor",
  "Dev Malhotra", "Tanvi Kulkarni", "Karan Chopra", "Meera Pillai", "Aditya Rao",
  "Nisha Gupta", "Siddharth Jain", "Ritika Agarwal", "Harsh Thakur", "Pooja Desai",
  "Manish Joshi", "Divya Menon", "Amit Bansal", "Shreya Ghosh", "Nikhil Dutta",
  "Anjali Saxena", "Varun Khanna", "Neha Bhatia", "Rajat Kohli", "Simran Kaur",
  "Kunal Shah", "Aishwarya Nair", "Pranav Hegde", "Rhea D'Souza", "Yash Chawla",
  "Shalini Das", "Gaurav Bhatnagar", "Nikita Roy", "Abhishek Mishra", "Sanjana Prakash",
  "Rohit Bhardwaj", "Zoya Sheikh",
];

const GOAL_POOL = [
  ["Fat loss", "Cardio"],
  ["Muscle gain", "Strength"],
  ["Endurance", "Running"],
  ["Flexibility", "Mobility"],
  ["Weight management", "HIIT"],
  ["Posture", "Strength"],
  ["General fitness", "Functional"],
  ["Marathon prep", "Endurance"],
  ["Rehab", "Mobility"],
  ["Athletic performance", "Strength"],
];

const TAG_POOL = [
  ["vip"], ["student"], ["corporate"], ["couple"], ["morning"],
  ["referral"], ["competitive"], ["night-owl"], ["weekend"], ["vip", "referral"],
];

const TRAINERS = [
  {
    name: "Marcus Bennett", bio: "Former national-level powerlifter with 10+ years coaching strength athletes of every level.",
    certifications: ["CSCS", "NSCA-CPT", "Precision Nutrition L1"], specialties: ["Strength", "Powerlifting"],
    instagram: "@marcusbennett.fit", youtube: "@marcusbennett", website: "marcusbennett.fit",
  },
  {
    name: "Elena Vasquez", bio: "Certified yoga & mobility specialist focused on recovery, breathwork and injury prevention.",
    certifications: ["RYT-500", "FRC Mobility", "FMS L2"], specialties: ["Yoga", "Mobility", "Rehab"],
    instagram: "@elenav.moves", youtube: "@elenav.moves", website: "",
  },
  {
    name: "Dev Anand", bio: "HIIT and functional training coach who has trained elite MMA athletes and weekend warriors alike.",
    certifications: ["ACE-CPT", "Kettlebell L2", "CF-L1"], specialties: ["HIIT", "Functional", "Boxing"],
    instagram: "@devanand.coach", youtube: "", website: "",
  },
  {
    name: "Sarah Lindqvist", bio: "Spin and endurance specialist, ex-pro cyclist, builds monster engines one interval at a time.",
    certifications: ["NASM-CPT", "Spinning L3"], specialties: ["Spin", "Endurance"],
    instagram: "@sarahlindqvist", youtube: "@sarahlindqvist", website: "",
  },
  {
    name: "Rajesh Kulkarni", bio: "Nutrition coach and bodybuilding trainer with a science-first approach to hypertrophy.",
    certifications: ["ISSA-CPT", "Sports Nutrition", "Muscle Activation"], specialties: ["Hypertrophy", "Nutrition"],
    instagram: "@rajeshk.fit", youtube: "", website: "",
  },
  {
    name: "Mia Okafor", bio: "Mobility-first coach blending pilates, stretching and controlled strength work.",
    certifications: ["NASM-CES", "Pilates Mat", "Trigger Point L2"], specialties: ["Mobility", "Pilates", "Recovery"],
    instagram: "@miaokafor.move", youtube: "", website: "",
  },
  {
    name: "Tom Hardy-Webb", bio: "CrossFit coach and olympic lifting enthusiast; programming for the box since 2015.",
    certifications: ["CF-L2", "USAW L1"], specialties: ["CrossFit", "Olympic Lifting"],
    instagram: "@tomhw.coach", youtube: "@tomhw", website: "",
  },
  {
    name: "Aisha Rahman", bio: "Youth fitness & boxing coach, known for the most-loved Saturday conditioning class in the city.",
    certifications: ["ACE-CPT", "Boxing L2"], specialties: ["Boxing", "Conditioning"],
    instagram: "@aishaboxes", youtube: "", website: "",
  },
];

const FACILITIES = [
  { name: "Strength Floor", type: "floor" as const, capacity: 40, description: "Free weights, racks and platforms." },
  { name: "Cardio Deck", type: "floor" as const, capacity: 30, description: "Treadmills, ellipticals, rowers and bikes." },
  { name: "Group Studio", type: "studio" as const, capacity: 24, description: "HIIT, conditioning and functional classes." },
  { name: "Spin Studio", type: "studio" as const, capacity: 20, description: "Indoor cycling classes." },
  { name: "Yoga Studio", type: "studio" as const, capacity: 18, description: "Calm, heated-capable studio for yoga & mobility." },
  { name: "Recovery Zone", type: "recovery" as const, capacity: 10, description: "Ice baths, sauna and massage room." },
  { name: "Boxing Ring", type: "zone" as const, capacity: 12, description: "Ring, bags and pads." },
  { name: "Outdoor Turf", type: "zone" as const, capacity: 25, description: "Sleds, sprints and conditioning." },
];

const EQUIPMENT = [
  ["Treadmill — Technogym Run", "cardio", "CARDIO-001"],
  ["Treadmill — Technogym Run", "cardio", "CARDIO-002"],
  ["Treadmill — Technogym Run", "cardio", "CARDIO-003"],
  ["Elliptical — Precor EFX", "cardio", "CARDIO-004"],
  ["Rower — Concept2 D", "cardio", "CARDIO-005"],
  ["Assault Bike — AirBike Pro", "cardio", "CARDIO-006"],
  ["Spin Bike — Schwinn AC", "cardio", "CARDIO-007"],
  ["Bench Press — Hammer Strength", "strength", "STR-001"],
  ["Squat Rack — Rogue R-3", "strength", "STR-002"],
  ["Smith Machine — Body-Solid", "strength", "STR-003"],
  ["Leg Press — Life Fitness", "strength", "STR-004"],
  ["Cable Crossover — Matrix", "strength", "STR-005"],
  ["Lat Pulldown — Matrix", "strength", "STR-006"],
  ["Dumbbell Set 2.5–40kg", "free-weights", "FW-001"],
  ["Kettlebell Set 8–32kg", "free-weights", "FW-002"],
  ["Olympic Barbell — Eleiko", "free-weights", "FW-003"],
  ["Bumper Plates Set", "free-weights", "FW-004"],
  ["Battle Ropes 15m", "functional", "FUN-001"],
  ["Sled — Rogue Dog Sled", "functional", "FUN-002"],
  ["Medicine Ball Set", "functional", "FUN-003"],
  ["Ice Bath — iCool Pro", "recovery", "REC-001"],
  ["Sauna — Harvia 8kW", "recovery", "REC-002"],
];

const INVENTORY: Array<[string, string, string, number, number, string, number]> = [
  ["Whey Protein 2kg", "supplements", "SUP-001", 14, 6, "units", 4599],
  ["Whey Protein 1kg", "supplements", "SUP-002", 22, 8, "units", 2599],
  ["Plant Protein 1kg", "supplements", "SUP-003", 4, 6, "units", 2899],
  ["Creatine Monohydrate 300g", "supplements", "SUP-004", 9, 5, "units", 1299],
  ["Pre-Workout 250g", "supplements", "SUP-005", 3, 6, "units", 1499],
  ["BCAA 2:1:1 400g", "supplements", "SUP-006", 12, 4, "units", 1599],
  ["Protein Bar (Box of 12)", "retail", "RET-001", 18, 6, "boxes", 1799],
  ["Shaker Bottle 700ml", "retail", "RET-002", 26, 10, "units", 399],
  ["Gym Towel — Pro", "retail", "RET-003", 5, 8, "units", 599],
  ["Resistance Bands Set", "merch", "MER-001", 16, 5, "sets", 899],
  ["Grip Socks", "merch", "MER-002", 2, 10, "pairs", 299],
  ["Steel Water Bottle 1L", "merch", "MER-003", 11, 8, "units", 649],
  ["Gym T-Shirt — Signature", "merch", "MER-004", 7, 6, "units", 999],
  ["Yoga Mat 6mm", "merch", "MER-005", 9, 4, "units", 1199],
  ["Lifting Chalk Block", "consumables", "CON-001", 1, 3, "units", 199],
  ["Disinfectant Spray", "consumables", "CON-002", 3, 4, "units", 249],
];

const PLANS = [
  { name: "Essential", description: "Full gym floor + cardio access.", price: 1999, billingCycle: "monthly", durationMonths: 1, features: ["Gym floor access", "Locker & shower", "One guest pass / month"], popular: false },
  { name: "Pro", description: "Everything in Essential plus group classes.", price: 3499, billingCycle: "monthly", durationMonths: 1, features: ["All Essential features", "Unlimited group classes", "1 PT session / month", "Nutrition starter plan"], popular: true },
  { name: "Elite", description: "Full access with recovery and PT.", price: 5499, billingCycle: "monthly", durationMonths: 1, features: ["All Pro features", "4 PT sessions / month", "Recovery zone access", "Priority class booking"], popular: false },
  { name: "Quarterly Pro", description: "3 months of Pro at a discount.", price: 9999, billingCycle: "quarterly", durationMonths: 3, features: ["All Pro features", "3 months", "Free gym kit"], popular: false },
  { name: "Half-Yearly Elite", description: "6 months of Elite, two months free.", price: 18999, billingCycle: "half-yearly", durationMonths: 6, features: ["All Elite features", "6 months", "Free body-composition scans"], popular: false },
  { name: "Annual Elite", description: "The full experience for a year.", price: 34999, billingCycle: "annual", durationMonths: 12, features: ["All Elite features", "12 months", "3 guest passes / month", "Freeze 30 days / year"], popular: false },
];

const BANNERS = [
  { title: "Monsoon Challenge — 30% off new memberships", ctaLabel: "Claim offer", ctaLink: "/join", offsetStart: -12, offsetEnd: 22, position: 0, active: true },
  { title: "Holiday schedule for Deepavali weekend", ctaLabel: "View schedule", ctaLink: "/schedule", offsetStart: -2, offsetEnd: 6, position: 1, active: true },
  { title: "PT Starter Pack — 4 sessions free", ctaLabel: "Book now", ctaLink: "/personal-training", offsetStart: -1, offsetEnd: 14, position: 2, active: true },
  { title: "New Year Stronger Campaign", ctaLabel: "Join now", ctaLink: "/join", offsetStart: 20, offsetEnd: 55, position: 3, active: false },
  { title: "Summer Batch Admissions Open", ctaLabel: "Enquire", ctaLink: "/contact", offsetStart: -60, offsetEnd: -30, position: 4, active: false },
];

const REELS = [
  { title: "60-second legs day finisher", durationSec: 58, order: 0, visible: true },
  { title: "Trainer tip: deadlift setup", durationSec: 42, order: 1, visible: true },
  { title: "Studio tour — see where you'll train", durationSec: 65, order: 2, visible: true },
  { title: "Member transformation: 6 months of consistency", durationSec: 48, order: 3, visible: true },
  { title: "Recovery corner: foam rolling routine", durationSec: 55, order: 4, visible: false },
  { title: "Spin class energy — 30 seconds of pure burn", durationSec: 38, order: 5, visible: true },
];

const ANNOUNCEMENTS = [
  { title: "Deepavali Holiday Schedule", body: "On Deepavali the gym will close at 4 PM. Group classes end at 2 PM. Recovery zone closes at 3:30 PM. Plan your sessions accordingly.", audience: "all", priority: "important", offsetStart: -2, offsetEnd: 6, active: true },
  { title: "New HIIT class added — Wednesday 7 AM", body: "We've added a new 45-minute HIIT Burn class on Wednesdays at 7 AM with Dev Anand. Bookings open now on the member app.", audience: "members", priority: "normal", offsetStart: -1, offsetEnd: 8, active: true },
  { title: "Water outage tomorrow morning", body: "Due to scheduled maintenance, showers will be unavailable tomorrow between 8–10 AM. Locker rooms stay open.", audience: "all", priority: "urgent", offsetStart: 0, offsetEnd: 1, active: true },
  { title: "Staff meeting — Monday 10 AM", body: "All trainers and front-desk staff: monthly review meeting in the Group Studio.", audience: "staff", priority: "normal", offsetStart: 0, offsetEnd: 2, active: true },
];

const POSTS = [
  { title: "Why progressive overload beats every fitness trend", type: "blog", excerpt: "The single principle that explains most gains — and how to apply it this week.", published: true, offset: -20 },
  { title: "Meet our new recovery zone", type: "gallery", excerpt: "Ice baths, sauna and massage room — now open for Elite members.", published: true, offset: -14 },
  { title: "Nutrition myths trainers hear every day", type: "blog", excerpt: "Carbs after 6 PM, detox teas and the rest — debunked.", published: true, offset: -9 },
  { title: "Community challenge: 10k steps in November", type: "blog", excerpt: "We're challenging every member to 10k steps a day. Weekly prizes.", published: true, offset: -4 },
  { title: "Elite members' Saturday brunch", type: "gallery", excerpt: "Photos from our first members-only brunch at the studio.", published: true, offset: -2 },
  { title: "Draft: Winter membership pricing guide", type: "blog", excerpt: "For the front desk — internal draft, do not publish yet.", published: false, offset: -1 },
];

export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    // Promotion rule: the first account to sign in becomes Super Admin, and
    // any account on the owner list always gets staff access.
    const actorId = await getAuthUserId(ctx);
    let settings = await getSettings(ctx);

    if (!settings) {
      // ---- first run: seed the demo dataset -------------------------------
      const rng = mulberry32(20260903);
      const now = Date.now();

    // ---- Settings ----------------------------------------------------------
    await ctx.db.insert("settings", {
      seededAt: now,
      ownerEmails: DEFAULT_OWNER_EMAILS,
      gym: {
        name: "Pulse Athletics",
        tagline: "Train hard. Recover smart.",
        address: "42 Stadium Road, Indiranagar",
        city: "Bengaluru",
        phone: "+91 98765 43210",
        email: "hello@pulseathletics.fit",
        hours: { weekdays: "5:00 AM – 11:00 PM", saturday: "6:00 AM – 10:00 PM", sunday: "7:00 AM – 9:00 PM" },
      },
      paymentGateway: {
        provider: "razorpay",
        stripePublishableKey: undefined,
        stripeSecretKey: undefined,
        razorpayKeyId: undefined,
        razorpayKeySecret: undefined,
        currency: "INR",
      },
      smtp: {
        host: undefined, port: undefined, user: undefined, password: undefined,
        fromName: "Pulse Athletics", fromEmail: "noreply@pulseathletics.fit", secure: true,
      },
      rolePermissions: {
        superAdmin: ["*"],
        admin: ["dashboard", "members", "trainers", "plans", "services", "equipment", "inventory", "content", "financials", "notifications", "settings.read", "settings.write"],
        staff: ["dashboard", "members.read", "trainers.read", "classes", "content.banners", "content.reels", "inventory.read", "notifications.create"],
      },
      staffInvites: [],
    });

    // ---- Facilities --------------------------------------------------------
    const facilityIds: Id<"facilities">[] = [];
    for (const f of FACILITIES) {
      facilityIds.push(await ctx.db.insert("facilities", { ...f, status: "open" }));
    }

    // ---- Services ----------------------------------------------------------
    const services: Array<{ name: string; category: "group-class" | "personal-training" | "recovery" | "nutrition" | "membership"; description: string; durationMin: number; price: number }> = [
      { name: "HIIT Burn", category: "group-class", description: "45 minutes of intervals, circuits and conditioning.", durationMin: 45, price: 0 },
      { name: "Spin Express", category: "group-class", description: "Indoor cycling to a driving playlist.", durationMin: 45, price: 0 },
      { name: "Power Yoga", category: "group-class", description: "Strength-based vinyasa flow.", durationMin: 60, price: 0 },
      { name: "Boxing Fundamentals", category: "group-class", description: "Footwork, technique and pad work.", durationMin: 60, price: 0 },
      { name: "CrossFit WOD", category: "group-class", description: "Daily workout of the day at the box.", durationMin: 60, price: 0 },
      { name: "1-on-1 Personal Training", category: "personal-training", description: "Private coaching, programming and accountability.", durationMin: 60, price: 1500 },
      { name: "PT 10-Pack", category: "personal-training", description: "Ten sessions of 1-on-1 training.", durationMin: 60, price: 13500 },
      { name: "Sports Massage", category: "recovery", description: "Deep tissue recovery massage.", durationMin: 45, price: 1800 },
      { name: "Ice Bath Recovery", category: "recovery", description: "Guided cold water immersion.", durationMin: 15, price: 500 },
      { name: "Nutrition Consultation", category: "nutrition", description: "60-minute plan built around your goals.", durationMin: 60, price: 2000 },
    ];
    for (const s of services) {
      await ctx.db.insert("services", { ...s, active: true });
    }

    // ---- Plans -------------------------------------------------------------
    const planIds: Id<"plans">[] = [];
    for (const p of PLANS) {
      planIds.push(
        await ctx.db.insert("plans", {
          name: p.name,
          description: p.description,
          price: p.price,
          billingCycle: p.billingCycle as "monthly",
          durationMonths: p.durationMonths,
          features: p.features,
          popular: p.popular,
          active: true,
        }),
      );
    }

    // ---- Trainers ----------------------------------------------------------
    const trainerIds: Id<"trainers">[] = [];
    for (const t of TRAINERS) {
      trainerIds.push(
        await ctx.db.insert("trainers", {
          name: t.name,
          email: `${t.name.toLowerCase().replace(/[^a-z]+/g, ".")}@pulseathletics.fit`,
          bio: t.bio,
          certifications: t.certifications,
          specialties: t.specialties,
          socials: { instagram: t.instagram, youtube: t.youtube, website: t.website },
          active: true,
          hiredAt: now - Math.floor(rng() * 700) * 86_400_000,
        }),
      );
    }

    // ---- Members + subscriptions -------------------------------------------
    const memberIds: Id<"members">[] = [];
    const activeMemberIds: Id<"members">[] = [];
    const planPool = planIds.slice(0, 3); // monthly plans for most members
    for (let i = 0; i < MEMBER_NAMES.length; i++) {
      const name = MEMBER_NAMES[i];
      const joinAgeDays = 20 + Math.floor(rng() * 540);
      const joinDate = now - joinAgeDays * 86_400_000;
      const isLead = i >= 38;
      const isExpired = !isLead && i % 11 === 7;
      const isFrozen = !isLead && !isExpired && i % 9 === 4;
      const status = isLead ? "lead" : isExpired ? "expired" : isFrozen ? "frozen" : "active";
      const mid = await ctx.db.insert("members", {
        name,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        phone: `+91 9${String(100000000 + Math.floor(rng() * 899999999))}`,
        gender: rng() > 0.5 ? "Male" : "Female",
        dateOfBirth: now - (22 + Math.floor(rng() * 28)) * 365 * 86_400_000,
        joinDate,
        status,
        visits: status === "lead" ? 0 : Math.floor(joinAgeDays / 2.2) + Math.floor(rng() * 20),
        lastVisit: isLead ? undefined : now - Math.floor(rng() * (status === "active" ? 9 : 45)) * 86_400_000,
        goals: pick(rng, GOAL_POOL),
        tags: pick(rng, TAG_POOL),
      });
      memberIds.push(mid);
      if (status === "active") activeMemberIds.push(mid);

      if (status !== "lead") {
        const planId = pick(rng, planPool);
        const plan = PLANS[planIds.indexOf(planId)];
        const startDaysAgo = Math.max(1, Math.floor(rng() * joinAgeDays));
        const startDate = now - startDaysAgo * 86_400_000;
        const durationMs = (plan?.durationMonths ?? 1) * 30 * 86_400_000;
        let endDate = startDate + durationMs;
        let subStatus: "active" | "paused" | "expired" = "active";
        if (status === "expired" || endDate < now) { subStatus = "expired"; endDate = now - Math.floor(rng() * 20) * 86_400_000; }
        else if (status === "frozen") subStatus = "paused";
        await ctx.db.insert("subscriptions", {
          memberId: mid,
          planId,
          planName: plan?.name ?? "Pro",
          price: plan?.price ?? 3499,
          startDate,
          endDate,
          status: subStatus,
          paymentMethod: pick(rng, ["UPI", "Card", "Cash", "Bank Transfer"]),
        });
      }
    }

    // ---- Classes (next 14 days) -------------------------------------------
    const classTitles = [
      ["HIIT Burn", 0], ["Spin Express", 1], ["Power Yoga", 2], ["Boxing Fundamentals", 3],
      ["CrossFit WOD", 4], ["Mobility & Stretch", 5], ["Strength Foundations", 0], ["Conditioning Circuit", 6],
    ] as const;
    const slots = [6, 7, 9, 17, 18, 19];
    const dayStart = startOfDay(now);
    for (let d = 0; d < 14; d++) {
      const day = dayStart + d * 86_400_000;
      const dayOfWeek = new Date(day).getDay();
      if (dayOfWeek === 0 && d === 0) continue; // skip sundays for most classes
      const count = dayOfWeek === 0 ? 2 : dayOfWeek === 6 ? 4 : 6;
      for (let c = 0; c < count; c++) {
        const [title, facilityIdx] = pick(rng, classTitles);
        const hour = slots[Math.floor(rng() * slots.length)];
        const start = day + hour * 3_600_000 + Math.floor(rng() * 4) * 900_000;
        const end = start + 45 * 60_000 + Math.floor(rng() * 2) * 900_000;
        const capacity = 12 + Math.floor(rng() * 18);
        const booked = Math.floor(rng() * (capacity + 3));
        await ctx.db.insert("classes", {
          title,
          trainerId: pick(rng, trainerIds),
          facilityId: facilityIds[facilityIdx % facilityIds.length],
          day,
          startTime: start,
          endTime: end,
          capacity,
          booked: Math.min(booked, capacity),
          status: start < now ? "done" : booked >= capacity ? "full" : "upcoming",
        });
      }
    }

    // ---- Equipment ---------------------------------------------------------
    for (const [name, category, serial] of EQUIPMENT) {
      const purchase = now - (100 + Math.floor(rng() * 900)) * 86_400_000;
      const lastMaint = now - Math.floor(rng() * 90) * 86_400_000;
      const nextMaint = lastMaint + (30 + Math.floor(rng() * 30)) * 86_400_000;
      await ctx.db.insert("equipment", {
        name,
        category: category as "cardio",
        facilityId: pick(rng, facilityIds),
        serial,
        purchaseDate: purchase,
        lastMaintenance: lastMaint,
        nextMaintenance: nextMaint,
        status: nextMaint < now ? "maintenance" : "operational",
      });
    }

    // ---- Inventory ---------------------------------------------------------
    for (const [name, category, sku, stock, reorderLevel, unit, price] of INVENTORY) {
      await ctx.db.insert("inventory", {
        name,
        category: category as "supplements",
        sku,
        stock,
        reorderLevel,
        unit,
        price,
        location: pick(rng, ["Front counter", "Store room A", "Store room B", "Reception"]),
        updatedAt: now - Math.floor(rng() * 14) * 86_400_000,
      });
    }

    // ---- Banners -----------------------------------------------------------
    for (const b of BANNERS) {
      await ctx.db.insert("banners", {
        title: b.title,
        image: undefined,
        ctaLabel: b.ctaLabel,
        ctaLink: b.ctaLink,
        startDate: now + b.offsetStart * 86_400_000,
        endDate: now + b.offsetEnd * 86_400_000,
        position: b.position,
        active: b.active,
      });
    }

    // ---- Reels -------------------------------------------------------------
    for (const r of REELS) {
      await ctx.db.insert("reels", {
        title: r.title,
        videoUrl: undefined,
        cover: undefined,
        durationSec: r.durationSec,
        visible: r.visible,
        order: r.order,
      });
    }

    // ---- Announcements -----------------------------------------------------
    for (const a of ANNOUNCEMENTS) {
      await ctx.db.insert("announcements", {
        title: a.title,
        body: a.body,
        audience: a.audience as "all",
        priority: a.priority as "normal",
        startsAt: now + a.offsetStart * 86_400_000,
        endsAt: a.offsetEnd ? now + a.offsetEnd * 86_400_000 : undefined,
        active: a.active,
      });
    }

    // ---- Posts -------------------------------------------------------------
    for (const p of POSTS) {
      await ctx.db.insert("posts", {
        title: p.title,
        type: p.type as "blog",
        excerpt: p.excerpt,
        body: undefined,
        image: undefined,
        published: p.published,
        publishedAt: p.published ? now + p.offset * 86_400_000 : undefined,
      });
    }

    // ---- Invoices (12 months for revenue charts) ---------------------------
    const planPrices = [1999, 3499, 5499, 9999, 18999];
    for (let m = 11; m >= 0; m--) {
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - m, 1);
      monthStart.setHours(0, 0, 0, 0);
      const count = 6 + Math.floor(rng() * 5);
      for (let i = 0; i < count; i++) {
        const memberId = pick(rng, memberIds);
        const member = await ctx.db.get(memberId);
        const amount = pick(rng, planPrices);
        const issuedAt = monthStart.getTime() + Math.floor(rng() * 28) * 86_400_000;
        const roll = rng();
        const status = roll > 0.96 ? "failed" : roll > 0.9 ? "refunded" : roll > 0.85 ? "pending" : "paid";
        await ctx.db.insert("invoices", {
          memberId,
          memberName: member?.name ?? "Unknown member",
          subscriptionId: undefined,
          planName: pick(rng, ["Essential", "Pro", "Elite"]),
          amount,
          status,
          issuedAt,
          paidAt: status === "paid" ? issuedAt + (Math.floor(rng() * 3) + 1) * 86_400_000 : undefined,
          method: pick(rng, ["upi", "card", "cash", "bank"]),
        });
      }
    }

    // ---- Notifications -----------------------------------------------------
    await ctx.db.insert("notifications", {
      title: "Back-to-gym offer — 30% off for returning members",
      body: "We miss you! Come back this month and get 30% off your next renewal.",
      channels: ["email", "sms"],
      audienceSegment: "inactive30",
      status: "sent",
      recipientCount: 6,
      sendAt: now - 3 * 86_400_000,
      sentAt: now - 3 * 86_400_000,
      createdBy: undefined,
    });
    await ctx.db.insert("notifications", {
      title: "Renewal reminder — your plan expires soon",
      body: "Your membership expires in 7 days. Renew now to keep your rate.",
      channels: ["push", "email"],
      audienceSegment: "expiring",
      status: "sent",
      recipientCount: 9,
      sendAt: now - 86_400_000,
      sentAt: now - 86_400_000,
      createdBy: undefined,
    });
    await ctx.db.insert("notifications", {
      title: "New Year Stronger — campaign launch",
      body: "Full membership campaign across push, email and SMS.",
      channels: ["push", "email", "sms"],
      audienceSegment: "all",
      status: "scheduled",
      recipientCount: undefined,
      sendAt: now + 3 * 86_400_000,
      sentAt: undefined,
      createdBy: undefined,
    });
    await ctx.db.insert("notifications", {
      title: "Welcome new members",
      body: "A warm welcome sequence for everyone who joined this month.",
      channels: ["email"],
      audienceSegment: "newMembers",
      status: "draft",
      recipientCount: undefined,
      sendAt: undefined,
      sentAt: undefined,
      createdBy: undefined,
    });
    await ctx.db.insert("notifications", {
      title: "No-plan members follow-up",
      body: "Members without an active plan — call list for the front desk.",
      channels: ["sms"],
      audienceSegment: "noPlan",
      status: "draft",
      recipientCount: undefined,
      sendAt: undefined,
      sentAt: undefined,
      createdBy: undefined,
    });

    // ---- Equipment maintenance heads-up (2 items due) ----------------------
    const dueItems = await ctx.db.query("equipment").filter((q) => q.eq(q.field("status"), "maintenance")).collect();
    for (const item of dueItems.slice(0, 2)) {
      await ctx.db.patch(item._id, { lastMaintenance: now - 40 * 86_400_000, nextMaintenance: now - 10 * 86_400_000 });
    }

      settings = await getSettings(ctx);
    }

    // Upgrade pre-seeded deployments with the owner list.
    if (settings && (settings.ownerEmails ?? []).length === 0) {
      await ctx.db.patch(settings._id, { ownerEmails: DEFAULT_OWNER_EMAILS });
    }

    // First account to sign in, or any account on the owner list, gets staff.
    if (actorId) {
      const actor = await ctx.db.get(actorId);
      if (actor && !(actor.role && STAFF_ROLES.includes(actor.role))) {
        const hasStaff = await ctx.db
          .query("users")
          .filter((q) =>
            q.or(
              q.eq(q.field("role"), ROLES.SUPER_ADMIN),
              q.eq(q.field("role"), ROLES.ADMIN),
              q.eq(q.field("role"), ROLES.STAFF),
            ),
          )
          .first();
        const ownerEmails = (settings?.ownerEmails ?? DEFAULT_OWNER_EMAILS).map((e) => e.toLowerCase());
        const isOwner = ownerEmails.includes((actor.email ?? "").toLowerCase());
        if (!hasStaff || isOwner) {
          await ctx.db.patch(actorId, { role: ROLES.SUPER_ADMIN });
        }
      }
    }
  },
});

/** Grants the signed-in account staff access when it is on the owner list
 *  (or when the workspace has no staff yet). Used from the blocked screen. */
export const claimStaff = mutation({
  args: {},
  handler: async (ctx) => {
    const actorId = await getAuthUserId(ctx);
    if (!actorId) throw new Error("You need to sign in first.");
    const actor = await ctx.db.get(actorId);
    if (!actor) throw new Error("Account not found.");
    if (actor.role && STAFF_ROLES.includes(actor.role)) return "already-staff";

    const settings = await getSettings(ctx);
    const ownerEmails = (settings?.ownerEmails ?? DEFAULT_OWNER_EMAILS).map((e) => e.toLowerCase());
    const hasStaff = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("role"), ROLES.SUPER_ADMIN),
          q.eq(q.field("role"), ROLES.ADMIN),
          q.eq(q.field("role"), ROLES.STAFF),
        ),
      )
      .first();
    if (!hasStaff || ownerEmails.includes((actor.email ?? "").toLowerCase())) {
      await ctx.db.patch(actorId, { role: ROLES.SUPER_ADMIN });
      return "granted";
    }
    throw new Error(
      "This account isn't on the owner list. Ask the gym owner to add your email to the owner list in Settings → Roles & Staff.",
    );
  },
});