import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const members = await ctx.db.query("members").collect();
    const subs = await ctx.db.query("subscriptions").collect();
    const plans = await ctx.db.query("plans").collect();
    const planMap = new Map(plans.map((p) => [p._id, p]));

    let rows = members.map((m) => {
      const sub = subs.find((s) => s.memberId === m._id);
      const plan = sub ? planMap.get(sub.planId) : undefined;
      return {
        ...m,
        planName: sub?.planName ?? plan?.name ?? "No plan",
        planId: sub?.planId,
        subStatus: sub?.status ?? "none",
        subEndDate: sub?.endDate,
        subStartDate: sub?.startDate,
      };
    });

    if (args.search) {
      const q = args.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q) ||
          (r.phone ?? "").includes(q),
      );
    }
    if (args.status && args.status !== "all") {
      rows = rows.filter((r) => r.status === args.status);
    }
    rows.sort((a, b) => b.joinDate - a.joinDate);
    return rows.slice(0, args.limit ?? 300);
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const members = await ctx.db.query("members").collect();
    const statusCounts: Record<string, number> = {};
    for (const m of members) statusCounts[m.status] = (statusCounts[m.status] ?? 0) + 1;
    return {
      total: members.length,
      byStatus: statusCounts,
      active: statusCounts["active"] ?? 0,
      leads: statusCounts["lead"] ?? 0,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    status: v.string(),
    goals: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    return await ctx.db.insert("members", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      gender: args.gender,
      dateOfBirth: args.dateOfBirth,
      joinDate: Date.now(),
      status: args.status as "active",
      visits: 0,
      lastVisit: undefined,
      goals: args.goals,
      notes: args.notes,
      tags: args.tags,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    status: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, ...patch } = args;
    await ctx.db.patch(id, { ...patch, status: patch.status as "active" | undefined });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const subs = await ctx.db.query("subscriptions").filter((q) => q.eq(q.field("memberId"), args.id)).collect();
    for (const s of subs) await ctx.db.delete(s._id);
    await ctx.db.delete(args.id);
  },
});

export const recordVisit = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const member = await ctx.db.get(args.id);
    if (!member) throw new Error("Member not found");
    await ctx.db.patch(args.id, {
      visits: (member.visits ?? 0) + 1,
      lastVisit: Date.now(),
      status: "active",
    });
  },
});