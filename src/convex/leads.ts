import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

const LEAD_STATUS = v.union(v.literal("new"), v.literal("contacted"), v.literal("converted"));

/**
 * Public lead capture for the customer site trial-booking form.
 * No auth required — anyone on the landing page can request a callback.
 */
export const submit = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    goal: v.string(),
    coachName: v.optional(v.string()),
    planName: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 80);
    const phone = args.phone.trim().replace(/[\s-]/g, "");
    const goal = args.goal.trim().slice(0, 80);
    if (name.length < 2) throw new Error("Please enter your name.");
    if (!/^\+?\d{8,15}$/.test(phone)) throw new Error("Please enter a valid phone number.");
    if (goal.length < 2) throw new Error("Pick a goal so we can match you with the right coach.");

    // Light abuse guard: max 3 requests per phone number per day.
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await ctx.db.query("leads").collect();
    const samePhone = recent.filter((l) => l.phone === phone && l._creationTime > dayAgo);
    if (samePhone.length >= 3) {
      throw new Error("You've already booked a callback — our team will reach out soon.");
    }

    await ctx.db.insert("leads", {
      name,
      phone,
      goal,
      coachName: args.coachName?.trim().slice(0, 80) || undefined,
      planName: args.planName?.trim().slice(0, 80) || undefined,
      source: args.source?.trim().slice(0, 60) || "homepage-trial",
      status: "new",
    });
  },
});

/** Most recent trial bookings, newest first. Staff only. */
export const recent = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const leads = await ctx.db.query("leads").order("desc").take(50);
    return leads.map((l) => ({
      _id: l._id,
      name: l.name,
      phone: l.phone,
      goal: l.goal,
      coachName: l.coachName,
      planName: l.planName,
      source: l.source,
      status: l.status,
      createdAt: l._creationTime,
    }));
  },
});

/** New (unhandled) lead count for dashboard badges. Staff only. */
export const newCount = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    return await ctx.db.query("leads").withIndex("by_status", (q) => q.eq("status", "new")).collect().then((rows) => rows.length);
  },
});

/** Move a lead through the pipeline (contacted → converted). Staff only. */
export const setStatus = mutation({
  args: { id: v.id("leads"), status: LEAD_STATUS, notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const lead = await ctx.db.get(args.id);
    if (!lead) throw new Error("Lead not found.");
    await ctx.db.patch(args.id, { status: args.status, notes: args.notes });
  },
});
