import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

// ---------------------------------------------------------------------------
// Facilities
// ---------------------------------------------------------------------------
export const listFacilities = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const facilities = await ctx.db.query("facilities").collect();
    const classes = await ctx.db.query("classes").collect();
    const now = Date.now();
    return facilities.map((f) => ({
      ...f,
      classesThisWeek: classes.filter(
        (c) => c.facilityId === f._id && c.startTime > now && c.startTime < now + 7 * 86_400_000,
      ).length,
    }));
  },
});

export const createFacility = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    capacity: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    return await ctx.db.insert("facilities", {
      name: args.name,
      type: args.type as "floor",
      capacity: args.capacity,
      description: args.description,
      status: "open",
    });
  },
});

export const updateFacility = mutation({
  args: {
    id: v.id("facilities"),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const { id, ...patch } = args;
    await ctx.db.patch(id, { ...patch, status: patch.status as "open" | undefined });
  },
});

export const removeFacility = mutation({
  args: { id: v.id("facilities") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const classes = await ctx.db.query("classes").filter((q) => q.eq(q.field("facilityId"), args.id)).collect();
    for (const c of classes) await ctx.db.patch(c._id, { facilityId: undefined });
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
export const listServices = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const services = await ctx.db.query("services").collect();
    return services.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createService = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    durationMin: v.optional(v.number()),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    return await ctx.db.insert("services", {
      name: args.name,
      category: args.category as "group-class",
      description: args.description,
      durationMin: args.durationMin,
      price: args.price,
      active: true,
    });
  },
});

export const updateService = mutation({
  args: {
    id: v.id("services"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    durationMin: v.optional(v.number()),
    price: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const { id, ...patch } = args;
    await ctx.db.patch(id, { ...patch, category: patch.category as "group-class" | undefined });
  },
});

export const removeService = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Class schedule
// ---------------------------------------------------------------------------
export const listClasses = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const classes = await ctx.db.query("classes").collect();
    const trainers = await ctx.db.query("trainers").collect();
    const facilities = await ctx.db.query("facilities").collect();
    const trainerMap = new Map(trainers.map((t) => [t._id, t.name]));
    const facilityMap = new Map(facilities.map((f) => [f._id, f.name]));
    const window = (args.days ?? 14) * 86_400_000;
    const now = Date.now();
    return classes
      .filter((c) => c.startTime > now - 86_400_000 && c.startTime < now + window)
      .map((c) => ({
        ...c,
        trainerName: c.trainerId ? trainerMap.get(c.trainerId) ?? "Unassigned" : "Unassigned",
        facilityName: c.facilityId ? facilityMap.get(c.facilityId) ?? "—" : "—",
      }))
      .sort((a, b) => a.startTime - b.startTime);
  },
});

export const createClass = mutation({
  args: {
    title: v.string(),
    trainerId: v.optional(v.id("trainers")),
    facilityId: v.optional(v.id("facilities")),
    startTime: v.number(),
    endTime: v.number(),
    capacity: v.number(),
    booked: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const day = new Date(args.startTime);
    day.setHours(0, 0, 0, 0);
    const booked = args.booked ?? 0;
    return await ctx.db.insert("classes", {
      title: args.title,
      trainerId: args.trainerId,
      facilityId: args.facilityId,
      day: day.getTime(),
      startTime: args.startTime,
      endTime: args.endTime,
      capacity: args.capacity,
      booked,
      status: booked >= args.capacity ? "full" : "upcoming",
    });
  },
});

export const updateClass = mutation({
  args: {
    id: v.id("classes"),
    title: v.optional(v.string()),
    trainerId: v.optional(v.id("trainers")),
    facilityId: v.optional(v.id("facilities")),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    capacity: v.optional(v.number()),
    booked: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, ...patch } = args;
    const patchAny: Record<string, unknown> = { ...patch };
    if (patch.startTime !== undefined) {
      const day = new Date(patch.startTime);
      day.setHours(0, 0, 0, 0);
      patchAny.day = day.getTime();
    }
    if (patch.status === "upcoming" || patch.status === "done" || patch.status === "full") {
      patchAny.status = patch.status;
    }
    if (patch.status === undefined && patch.booked !== undefined && patch.capacity !== undefined) {
      patchAny.status = patch.booked >= patch.capacity ? "full" : "upcoming";
    }
    await ctx.db.patch(id, patchAny as never);
  },
});

export const removeClass = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    await ctx.db.delete(args.id);
  },
});