import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getActor, getSettings, requireRole, STAFF_ROLES } from "./lib";
import { ROLES } from "./schema";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const actor = await getActor(ctx);
    if (!actor || !STAFF_ROLES.includes(actor.role ?? ("" as never))) return null;
    return await getSettings(ctx);
  },
});

export const updateGym = mutation({
  args: {
    name: v.string(),
    tagline: v.string(),
    address: v.string(),
    city: v.string(),
    phone: v.string(),
    email: v.string(),
    weekdays: v.string(),
    saturday: v.string(),
    sunday: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    const doc = await getSettings(ctx);
    if (!doc) return;
    await ctx.db.patch(doc._id, {
      gym: {
        name: args.name,
        tagline: args.tagline,
        address: args.address,
        city: args.city,
        phone: args.phone,
        email: args.email,
        hours: { weekdays: args.weekdays, saturday: args.saturday, sunday: args.sunday },
      },
    });
  },
});

export const updatePayment = mutation({
  args: {
    provider: v.string(),
    stripePublishableKey: v.optional(v.string()),
    stripeSecretKey: v.optional(v.string()),
    razorpayKeyId: v.optional(v.string()),
    razorpayKeySecret: v.optional(v.string()),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    const doc = await getSettings(ctx);
    if (!doc) return;
    await ctx.db.patch(doc._id, {
      paymentGateway: {
        provider: args.provider as "razorpay",
        stripePublishableKey: args.stripePublishableKey,
        stripeSecretKey: args.stripeSecretKey,
        razorpayKeyId: args.razorpayKeyId,
        razorpayKeySecret: args.razorpayKeySecret,
        currency: args.currency,
      },
    });
  },
});

export const updateSmtp = mutation({
  args: {
    host: v.optional(v.string()),
    port: v.optional(v.number()),
    user: v.optional(v.string()),
    password: v.optional(v.string()),
    fromName: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    secure: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    const doc = await getSettings(ctx);
    if (!doc) return;
    await ctx.db.patch(doc._id, { smtp: args });
  },
});

export const updatePermissions = mutation({
  args: { role: v.string(), permissions: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.SUPER_ADMIN]);
    const doc = await getSettings(ctx);
    if (!doc) return;
    await ctx.db.patch(doc._id, {
      rolePermissions: { ...doc.rolePermissions, [args.role]: args.permissions },
    });
  },
});

export const inviteStaff = mutation({
  args: { email: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    const doc = await getSettings(ctx);
    if (!doc) return;
    const invites = doc.staffInvites ?? [];
    if (invites.some((i) => i.email.toLowerCase() === args.email.toLowerCase())) {
      throw new Error("An invite for this email already exists.");
    }
    await ctx.db.patch(doc._id, {
      staffInvites: [...invites, { email: args.email, role: args.role as "staff", invitedAt: Date.now() }],
    });
  },
});

export const revokeStaff = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    const doc = await getSettings(ctx);
    if (!doc) return;
    await ctx.db.patch(doc._id, {
      staffInvites: (doc.staffInvites ?? []).filter((i) => i.email.toLowerCase() !== args.email.toLowerCase()),
    });
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (user && user.role !== ROLES.SUPER_ADMIN) {
      await ctx.db.patch(user._id, { role: ROLES.MEMBER });
    }
  },
});

export const setUserRole = mutation({
  args: { userId: v.id("users"), role: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    const actor = await requireRole(ctx, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    if (target.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new Error("Only a Super Admin can change a Super Admin.");
    }
    await ctx.db.patch(args.userId, { role: args.role as "staff" });
  },
});

export const listStaff = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const [users, settings] = await Promise.all([
      ctx.db.query("users").collect(),
      getSettings(ctx),
    ]);
    const staffUsers = users
      .filter((u) => u.role && STAFF_ROLES.includes(u.role as never))
      .map((u) => ({ kind: "user" as const, id: u._id, name: u.name ?? "—", email: u.email ?? "", role: u.role ?? "member", invitedAt: u._creationTime }));
    const invites = (settings?.staffInvites ?? []).map((i) => ({
      kind: "invite" as const,
      id: i.email,
      name: "Pending invite",
      email: i.email,
      role: i.role,
      invitedAt: i.invitedAt,
    }));
    return [...staffUsers, ...invites].sort((a, b) => b.invitedAt - a.invitedAt);
  },
});