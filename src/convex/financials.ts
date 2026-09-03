import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const summary = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const invoices = await ctx.db.query("invoices").collect();
    const now = Date.now();

    const monthKey = (ts: number) => {
      const d = new Date(ts);
      return `${d.getFullYear()}-${d.getMonth()}`;
    };
    const thisMonthKey = monthKey(now);

    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let outstanding = 0;
    let refunds = 0;
    const revenueByMonth: Record<string, number> = {};
    const byPlan: Record<string, number> = {};

    for (const inv of invoices) {
      const key = monthKey(inv.issuedAt);
      if (inv.status === "paid" && inv.paidAt) {
        totalRevenue += inv.amount;
        revenueByMonth[key] = (revenueByMonth[key] ?? 0) + inv.amount;
        byPlan[inv.planName] = (byPlan[inv.planName] ?? 0) + inv.amount;
        if (key === thisMonthKey) thisMonthRevenue += inv.amount;
      } else if (inv.status === "pending") {
        outstanding += inv.amount;
      } else if (inv.status === "refunded") {
        refunds += inv.amount;
      }
    }

    // Last 12 months series
    const revenueTrend: Array<{ month: string; revenue: number }> = [];
    const memberTrend: Array<{ month: string; members: number }> = [];
    const members = await ctx.db.query("members").collect();
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - m, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      revenueTrend.push({
        month: MONTHS[d.getMonth()],
        revenue: revenueByMonth[key] ?? 0,
      });
      memberTrend.push({
        month: MONTHS[d.getMonth()],
        members: members.filter((mm) => mm.joinDate >= start && mm.joinDate < end).length,
      });
    }

    return {
      totalRevenue,
      thisMonthRevenue,
      outstanding,
      refunds,
      revenueTrend,
      memberTrend,
      revenueByPlan: Object.entries(byPlan)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      invoicesThisMonth: invoices.filter((i) => monthKey(i.issuedAt) === thisMonthKey).length,
    };
  },
});

export const listInvoices = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    let rows = await ctx.db.query("invoices").collect();
    rows = rows.sort((a, b) => b.issuedAt - a.issuedAt);
    if (args.search) {
      const q = args.search.toLowerCase();
      rows = rows.filter(
        (r) => r.memberName.toLowerCase().includes(q) || r.planName.toLowerCase().includes(q),
      );
    }
    if (args.status && args.status !== "all") {
      rows = rows.filter((r) => r.status === args.status);
    }
    return rows.slice(0, args.limit ?? 300);
  },
});

export const createInvoice = mutation({
  args: {
    memberId: v.id("members"),
    amount: v.number(),
    planName: v.string(),
    status: v.optional(v.string()),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");
    const now = Date.now();
    return await ctx.db.insert("invoices", {
      memberId: args.memberId,
      memberName: member.name,
      subscriptionId: undefined,
      planName: args.planName,
      amount: args.amount,
      status: (args.status as "pending") ?? "pending",
      issuedAt: now,
      paidAt: args.status === "paid" ? now : undefined,
      method: (args.method as "upi") ?? "upi",
    });
  },
});

export const recordPayment = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const inv = await ctx.db.get(args.id);
    if (!inv) throw new Error("Invoice not found");
    if (inv.status === "refunded") throw new Error("Refunded invoices cannot be marked paid");
    await ctx.db.patch(args.id, { status: "paid", paidAt: Date.now() });
  },
});

export const refundInvoice = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const inv = await ctx.db.get(args.id);
    if (!inv) throw new Error("Invoice not found");
    if (inv.status === "refunded") throw new Error("Already refunded");
    await ctx.db.patch(args.id, { status: "refunded" });
  },
});

export const removeInvoice = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    await ctx.db.delete(args.id);
  },
});