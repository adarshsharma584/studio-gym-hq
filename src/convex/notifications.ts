import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const items = await ctx.db.query("notifications").collect();
    return items.sort((a, b) => (b.sendAt ?? b._creationTime) - (a.sendAt ?? a._creationTime));
  },
});

/** Count members matching each audience segment (used by the compose UI). */
export const segmentCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const members = await ctx.db.query("members").collect();
    const subs = await ctx.db.query("subscriptions").collect();
    const now = Date.now();
    const withPlan = new Set(subs.filter((s) => s.status === "active").map((s) => s.memberId));

    const count = (pred: (m: (typeof members)[number]) => boolean) =>
      members.filter(pred).length;

    return {
      all: members.length,
      inactive30: count((m) => m.lastVisit !== undefined && now - m.lastVisit > 30 * 86_400_000),
      expiring: count((m) => {
        const sub = subs.find((s) => s.memberId === m._id && s.status === "active");
        return !!sub && sub.endDate < now + 14 * 86_400_000;
      }),
      newMembers: count((m) => now - m.joinDate < 30 * 86_400_000),
      noPlan: count((m) => !withPlan.has(m._id)),
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    channels: v.array(v.string()),
    audienceSegment: v.string(),
    status: v.string(),
    sendAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    return await ctx.db.insert("notifications", {
      title: args.title,
      body: args.body,
      channels: args.channels as "push"[],
      audienceSegment: args.audienceSegment as "all",
      status: args.status as "draft",
      recipientCount: undefined,
      sendAt: args.sendAt,
      sentAt: undefined,
      createdBy: undefined,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notifications"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    channels: v.optional(v.array(v.string())),
    audienceSegment: v.optional(v.string()),
    status: v.optional(v.string()),
    sendAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, ...patch } = args;
    await ctx.db.patch(id, {
      ...patch,
      channels: patch.channels as "push"[] | undefined,
      audienceSegment: patch.audienceSegment as "all" | undefined,
      status: patch.status as "draft" | undefined,
    });
  },
});

/** Simulate sending: resolves the audience and marks the campaign sent. */
export const send = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Campaign not found");
    if (item.status === "sent") throw new Error("Campaign already sent");

    const members = await ctx.db.query("members").collect();
    const subs = await ctx.db.query("subscriptions").collect();
    const now = Date.now();
    let recipients: string[] = [];

    switch (item.audienceSegment) {
      case "inactive30":
        recipients = members.filter((m) => m.lastVisit !== undefined && now - m.lastVisit > 30 * 86_400_000).map((m) => m._id);
        break;
      case "expiring":
        recipients = members
          .filter((m) => {
            const sub = subs.find((s) => s.memberId === m._id && s.status === "active");
            return !!sub && sub.endDate < now + 14 * 86_400_000;
          })
          .map((m) => m._id);
        break;
      case "newMembers":
        recipients = members.filter((m) => now - m.joinDate < 30 * 86_400_000).map((m) => m._id);
        break;
      case "noPlan": {
        const withPlan = new Set(subs.filter((s) => s.status === "active").map((s) => s.memberId));
        recipients = members.filter((m) => !withPlan.has(m._id)).map((m) => m._id);
        break;
      }
      default:
        recipients = members.map((m) => m._id);
    }

    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: now,
      sendAt: item.sendAt ?? now,
      recipientCount: recipients.length,
    });
    return recipients.length;
  },
});

export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    await ctx.db.delete(args.id);
  },
});