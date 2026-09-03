import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const trainers = await ctx.db.query("trainers").collect();
    const classes = await ctx.db.query("classes").collect();
    const now = Date.now();

    const rows = trainers.map((t) => {
      const upcoming = classes.filter(
        (c) => c.trainerId === t._id && c.startTime > now && c.status !== "cancelled",
      );
      const thisWeek = upcoming.filter((c) => c.startTime < now + 7 * 86_400_000).length;
      return { ...t, upcomingClasses: upcoming.length, classesThisWeek: thisWeek };
    });

    if (args.search) {
      const q = args.search.toLowerCase();
      return rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.specialties.some((s) => s.toLowerCase().includes(q)) ||
          (r.email ?? "").toLowerCase().includes(q),
      );
    }
    return rows;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    certifications: v.array(v.string()),
    specialties: v.array(v.string()),
    image: v.optional(v.string()),
    socials: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        youtube: v.optional(v.string()),
        website: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    return await ctx.db.insert("trainers", {
      ...args,
      active: true,
      hiredAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("trainers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    certifications: v.optional(v.array(v.string())),
    specialties: v.optional(v.array(v.string())),
    image: v.optional(v.string()),
    socials: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        youtube: v.optional(v.string()),
        website: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const toggleActive = mutation({
  args: { id: v.id("trainers"), active: v.boolean() },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    await ctx.db.patch(args.id, { active: args.active });
  },
});

export const remove = mutation({
  args: { id: v.id("trainers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const classes = await ctx.db.query("classes").filter((q) => q.eq(q.field("trainerId"), args.id)).collect();
    for (const c of classes) await ctx.db.patch(c._id, { trainerId: undefined });
    await ctx.db.delete(args.id);
  },
});