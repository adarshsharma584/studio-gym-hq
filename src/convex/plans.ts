import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const plans = await ctx.db.query("plans").collect();
    const subs = await ctx.db.query("subscriptions").collect();
    const activeByPlan: Record<string, number> = {};
    for (const s of subs) {
      if (s.status === "active") activeByPlan[s.planId] = (activeByPlan[s.planId] ?? 0) + 1;
    }
    return plans
      .map((p) => ({ ...p, activeSubscribers: activeByPlan[p._id] ?? 0 }))
      .sort((a, b) => a.price - b.price);
  },
});

export const createPlan = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    billingCycle: v.string(),
    durationMonths: v.number(),
    features: v.array(v.string()),
    popular: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    return await ctx.db.insert("plans", {
      ...args,
      billingCycle: args.billingCycle as "monthly",
      active: true,
    });
  },
});

export const updatePlan = mutation({
  args: {
    id: v.id("plans"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    billingCycle: v.optional(v.string()),
    durationMonths: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    popular: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const { id, ...patch } = args;
    await ctx.db.patch(id, {
      ...patch,
      billingCycle: patch.billingCycle as "monthly" | undefined,
    });
  },
});

export const removePlan = mutation({
  args: { id: v.id("plans") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const subs = await ctx.db.query("subscriptions").filter((q) => q.eq(q.field("planId"), args.id)).collect();
    if (subs.length > 0) {
      throw new Error("Cannot delete a plan that still has subscriptions. Deactivate it instead.");
    }
    await ctx.db.delete(args.id);
  },
});

export const listSubscriptions = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const subs = await ctx.db.query("subscriptions").collect();
    const members = await ctx.db.query("members").collect();
    const memberMap = new Map(members.map((m) => [m._id, m]));

    let rows = subs
      .map((s) => ({
        ...s,
        memberName: memberMap.get(s.memberId)?.name ?? "Unknown",
        memberStatus: memberMap.get(s.memberId)?.status ?? "unknown",
      }))
      .sort((a, b) => b.startDate - a.startDate);

    if (args.search) {
      const q = args.search.toLowerCase();
      rows = rows.filter((r) => r.memberName.toLowerCase().includes(q) || r.planName.toLowerCase().includes(q));
    }
    if (args.status && args.status !== "all") {
      rows = rows.filter((r) => r.status === args.status);
    }
    return rows.slice(0, args.limit ?? 300);
  },
});

export const createSubscription = mutation({
  args: {
    memberId: v.id("members"),
    planId: v.id("plans"),
    startDate: v.number(),
    endDate: v.number(),
    status: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const member = await ctx.db.get(args.memberId);
    const plan = await ctx.db.get(args.planId);
    if (!member || !plan) throw new Error("Member or plan not found");

    const id = await ctx.db.insert("subscriptions", {
      memberId: args.memberId,
      planId: args.planId,
      planName: plan.name,
      price: plan.price,
      startDate: args.startDate,
      endDate: args.endDate,
      status: (args.status as "active") ?? "active",
      paymentMethod: args.paymentMethod,
    });
    // Signing up a plan activates the member
    await ctx.db.patch(args.memberId, { status: "active" });

    // Auto-issue an invoice for the plan
    await ctx.db.insert("invoices", {
      memberId: args.memberId,
      memberName: member.name,
      subscriptionId: id,
      planName: plan.name,
      amount: plan.price,
      status: "pending",
      issuedAt: Date.now(),
      paidAt: undefined,
      method: (args.paymentMethod === "Cash" ? "cash" : args.paymentMethod === "Bank Transfer" ? "bank" : "upi") as "upi",
    });
    return id;
  },
});

export const updateSubscription = mutation({
  args: {
    id: v.id("subscriptions"),
    status: v.optional(v.string()),
    endDate: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const { id, ...patch } = args;
    const sub = await ctx.db.get(id);
    await ctx.db.patch(id, { ...patch, status: patch.status as "active" | undefined });
    if (sub && patch.status) {
      const member = await ctx.db.get(sub.memberId);
      if (member) {
        await ctx.db.patch(sub.memberId, {
          status: patch.status === "active" ? "active" : patch.status === "expired" ? "expired" : "frozen",
        });
      }
    }
  },
});

export const renewSubscription = mutation({
  args: { id: v.id("subscriptions"), months: v.number() },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error("Subscription not found");
    const base = Math.max(sub.endDate, Date.now());
    await ctx.db.patch(args.id, {
      endDate: base + args.months * 30 * 86_400_000,
      status: "active",
    });
    await ctx.db.patch(sub.memberId, { status: "active" });
    await ctx.db.insert("invoices", {
      memberId: sub.memberId,
      memberName: (await ctx.db.get(sub.memberId))?.name ?? "Member",
      subscriptionId: sub._id,
      planName: sub.planName,
      amount: sub.price,
      status: "pending",
      issuedAt: Date.now(),
      paidAt: undefined,
      method: "upi",
    });
  },
});

export const expiringSoon = query({
  args: { windowDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const window = (args.windowDays ?? 14) * 86_400_000;
    const subs = await ctx.db.query("subscriptions").collect();
    const members = await ctx.db.query("members").collect();
    const memberMap = new Map(members.map((m) => [m._id, m]));
    return subs
      .filter((s) => s.status === "active" && s.endDate < Date.now() + window)
      .map((s) => ({
        ...s,
        memberName: memberMap.get(s.memberId)?.name ?? "Unknown",
      }))
      .sort((a, b) => a.endDate - b.endDate);
  },
});

