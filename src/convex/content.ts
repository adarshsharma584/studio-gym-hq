import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function withActiveFlag<T extends { startDate?: number; endDate?: number; startsAt?: number; endsAt?: number }>(
  item: T,
): T & { isActive: boolean } {
  const now = Date.now();
  if (item.startDate !== undefined && item.endDate !== undefined) {
    return { ...item, isActive: now >= item.startDate && now <= item.endDate };
  }
  if (item.startsAt !== undefined) {
    return { ...item, isActive: now >= item.startsAt && (item.endsAt === undefined || now <= item.endsAt) };
  }
  return { ...item, isActive: true };
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const [banners, reels, announcements, posts] = await Promise.all([
      ctx.db.query("banners").collect(),
      ctx.db.query("reels").collect(),
      ctx.db.query("announcements").collect(),
      ctx.db.query("posts").collect(),
    ]);
    return {
      banners: banners.map((b) => withActiveFlag(b)).sort((a, b) => a.position - b.position),
      reels: reels.sort((a, b) => a.order - b.order),
      announcements: announcements.map((a) => withActiveFlag(a)).sort((a, b) => b.startsAt - a.startsAt),
      posts: posts.sort((a, b) => (b.publishedAt ?? b._creationTime) - (a.publishedAt ?? a._creationTime)),
    };
  },
});

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------
export const saveBanner = mutation({
  args: {
    id: v.optional(v.id("banners")),
    title: v.string(),
    image: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    ctaLink: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    position: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, ...rest } = args;
    if (args.endDate <= args.startDate) throw new Error("End date must be after start date");
    if (id) {
      await ctx.db.patch(id, rest);
      return id;
    }
    return await ctx.db.insert("banners", rest);
  },
});

export const removeBanner = mutation({
  args: { id: v.id("banners") },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Reels
// ---------------------------------------------------------------------------
export const saveReel = mutation({
  args: {
    id: v.optional(v.id("reels")),
    title: v.string(),
    videoUrl: v.optional(v.string()),
    cover: v.optional(v.string()),
    durationSec: v.optional(v.number()),
    visible: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, ...rest } = args;
    if (id) {
      await ctx.db.patch(id, { ...rest, order: rest.order ?? 0 });
      return id;
    }
    const count = (await ctx.db.query("reels").collect()).length;
    return await ctx.db.insert("reels", { ...rest, order: rest.order ?? count });
  },
});

export const removeReel = mutation({
  args: { id: v.id("reels") },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------
export const saveAnnouncement = mutation({
  args: {
    id: v.optional(v.id("announcements")),
    title: v.string(),
    body: v.string(),
    audience: v.string(),
    priority: v.string(),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, ...rest } = args;
    if (rest.endsAt !== undefined && rest.endsAt <= rest.startsAt) {
      throw new Error("End time must be after start time");
    }
    if (id) {
      await ctx.db.patch(id, {
        ...rest,
        audience: rest.audience as "all",
        priority: rest.priority as "normal",
      });
      return id;
    }
    return await ctx.db.insert("announcements", {
      ...rest,
      audience: rest.audience as "all",
      priority: rest.priority as "normal",
    });
  },
});

export const removeAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Posts (blog / gallery)
// ---------------------------------------------------------------------------
export const savePost = mutation({
  args: {
    id: v.optional(v.id("posts")),
    title: v.string(),
    type: v.string(),
    excerpt: v.optional(v.string()),
    body: v.optional(v.string()),
    image: v.optional(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, ...rest } = args;
    const patch = {
      ...rest,
      type: rest.type as "blog",
      publishedAt: rest.published ? Date.now() : undefined,
    };
    if (id) {
      await ctx.db.patch(id, patch);
      return id;
    }
    return await ctx.db.insert("posts", patch);
  },
});

export const removePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    await ctx.db.delete(args.id);
  },
});