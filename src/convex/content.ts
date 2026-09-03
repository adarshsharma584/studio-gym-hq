import { v } from "convex/values";
import { MutationCtx, mutation, query } from "./_generated/server";
import { getSettings, requireRole, STAFF_ROLES } from "./lib";
import type { Id } from "./_generated/dataModel";

/** Resolve a freshly uploaded file to its public URL, or fail loudly. */
async function resolveOrThrow(ctx: MutationCtx, storageId: Id<"_storage">) {
  const url = await ctx.storage.getUrl(storageId);
  if (!url) throw new Error("Uploaded file could not be resolved — please try uploading again.");
  return url;
}

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
// Media uploads (Convex file storage)
// ---------------------------------------------------------------------------
/** Step 1: get a short-lived upload URL. Staff only. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Step 2 (preview): turn a storage id into its public URL right after upload. */
export const resolveUploadUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await requireRole(ctx, STAFF_ROLES);
    return await ctx.storage.getUrl(storageId);
  },
});

/** Clean up a file that was uploaded but never saved (dialog cancelled). */
export const discardUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await requireRole(ctx, STAFF_ROLES);
    await ctx.storage.delete(storageId);
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
    storageId: v.optional(v.id("_storage")),
    removeStorageId: v.optional(v.id("_storage")),
    ctaLabel: v.optional(v.string()),
    ctaLink: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    position: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, storageId, removeStorageId, ...rest } = args;
    if (args.endDate <= args.startDate) throw new Error("End date must be after start date");
    if (removeStorageId && removeStorageId !== storageId) {
      await ctx.storage.delete(removeStorageId);
    }
    const image = storageId ? await resolveOrThrow(ctx, storageId) : rest.image;
    const patch = { ...rest, image, storageId };
    if (id) {
      await ctx.db.patch(id, patch);
      return id;
    }
    return await ctx.db.insert("banners", patch);
  },
});

export const removeBanner = mutation({
  args: { id: v.id("banners"), storageId: v.optional(v.id("_storage")) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    if (args.storageId) await ctx.storage.delete(args.storageId);
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
    storageId: v.optional(v.id("_storage")),
    removeStorageId: v.optional(v.id("_storage")),
    cover: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    removeCoverStorageId: v.optional(v.id("_storage")),
    durationSec: v.optional(v.number()),
    visible: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, storageId, removeStorageId, coverStorageId, removeCoverStorageId, ...rest } = args;
    if (removeStorageId && removeStorageId !== storageId) {
      await ctx.storage.delete(removeStorageId);
    }
    if (removeCoverStorageId && removeCoverStorageId !== coverStorageId) {
      await ctx.storage.delete(removeCoverStorageId);
    }
    const videoUrl = storageId ? await resolveOrThrow(ctx, storageId) : rest.videoUrl;
    const cover = coverStorageId ? await resolveOrThrow(ctx, coverStorageId) : rest.cover;
    const patch = { ...rest, videoUrl, cover, storageId, coverStorageId, order: rest.order ?? 0 };
    if (id) {
      await ctx.db.patch(id, patch);
      return id;
    }
    const count = (await ctx.db.query("reels").collect()).length;
    return await ctx.db.insert("reels", { ...patch, order: rest.order ?? count });
  },
});

export const removeReel = mutation({
  args: {
    id: v.id("reels"),
    storageId: v.optional(v.id("_storage")),
    coverStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    if (args.storageId) await ctx.storage.delete(args.storageId);
    if (args.coverStorageId) await ctx.storage.delete(args.coverStorageId);
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
    storageId: v.optional(v.id("_storage")),
    removeStorageId: v.optional(v.id("_storage")),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const { id, storageId, removeStorageId, ...rest } = args;
    if (removeStorageId && removeStorageId !== storageId) {
      await ctx.storage.delete(removeStorageId);
    }
    const image = storageId ? await resolveOrThrow(ctx, storageId) : rest.image;
    const patch = {
      ...rest,
      type: rest.type as "blog",
      image,
      storageId,
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
  args: { id: v.id("posts"), storageId: v.optional(v.id("_storage")) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    if (args.storageId) await ctx.storage.delete(args.storageId);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Public customer-site feed — no auth required. Only returns content that is
// enabled and currently inside its schedule window, so the customer UI always
// reflects exactly what admins publish.
// ---------------------------------------------------------------------------
export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const [banners, reels, announcements, posts, plans, services, trainers, settings] = await Promise.all([
      ctx.db.query("banners").collect(),
      ctx.db.query("reels").collect(),
      ctx.db.query("announcements").collect(),
      ctx.db.query("posts").collect(),
      ctx.db.query("plans").collect(),
      ctx.db.query("services").collect(),
      ctx.db.query("trainers").collect(),
      getSettings(ctx),
    ]);
    return {
      gym: settings?.gym ?? null,
      banners: banners
        .filter((b) => b.active && b.startDate <= now && now <= b.endDate)
        .sort((a, b) => a.position - b.position),
      reels: reels.filter((r) => r.visible).sort((a, b) => a.order - b.order),
      announcements: announcements
        .filter((a) => a.active && a.startsAt <= now && (a.endsAt === undefined || now <= a.endsAt))
        .sort((a, b) => b.startsAt - a.startsAt),
      posts: posts
        .filter((p) => p.published)
        .sort((a, b) => (b.publishedAt ?? b._creationTime) - (a.publishedAt ?? a._creationTime)),
      plans: plans.filter((p) => p.active).sort((a, b) => a.price - b.price),
      services: services.filter((s) => s.active),
      trainers: trainers.filter((t) => t.active),
    };
  },
});