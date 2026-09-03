import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";
import type { Doc } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------
export const listEquipment = query({
  args: { search: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const equipment = await ctx.db.query("equipment").collect();
    const facilities = await ctx.db.query("facilities").collect();
    const facilityMap = new Map(facilities.map((f) => [f._id, f.name]));
    const now = Date.now();

    let rows = equipment.map((e) => {
      const maintenanceDue = !!e.nextMaintenance && e.nextMaintenance < now && e.status !== "retired";
      const effectiveStatus = maintenanceDue && e.status === "operational" ? "maintenance" : e.status;
      return {
        ...e,
        facilityName: e.facilityId ? facilityMap.get(e.facilityId) ?? "—" : "—",
        maintenanceDue,
        effectiveStatus,
      };
    });

    if (args.search) {
      const q = args.search.toLowerCase();
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.serial ?? "").toLowerCase().includes(q),
      );
    }
    if (args.status && args.status !== "all") {
      rows = rows.filter((r) => r.effectiveStatus === args.status);
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createEquipment = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    facilityId: v.optional(v.id("facilities")),
    serial: v.optional(v.string()),
    purchaseDate: v.optional(v.number()),
    nextMaintenance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    return await ctx.db.insert("equipment", {
      name: args.name,
      category: args.category as "cardio",
      facilityId: args.facilityId,
      serial: args.serial,
      purchaseDate: args.purchaseDate,
      lastMaintenance: undefined,
      nextMaintenance: args.nextMaintenance,
      status: "operational",
    });
  },
});

export const updateEquipment = mutation({
  args: {
    id: v.id("equipment"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    facilityId: v.optional(v.id("facilities")),
    serial: v.optional(v.string()),
    status: v.optional(v.string()),
    nextMaintenance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const { id, ...patch } = args;
    await ctx.db.patch(id, {
      ...patch,
      category: patch.category as "cardio" | undefined,
      status: patch.status as "operational" | undefined,
    });
  },
});

/** Mark equipment as maintained — resets the maintenance clock. */
export const markMaintained = mutation({
  args: { id: v.id("equipment") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "operational",
      lastMaintenance: now,
      nextMaintenance: now + 30 * 86_400_000,
    });
  },
});

export const removeEquipment = mutation({
  args: { id: v.id("equipment") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Inventory & stock
// ---------------------------------------------------------------------------
export const listInventory = query({
  args: { search: v.optional(v.string()), lowStockOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const items = await ctx.db.query("inventory").collect();
    let rows: Array<Doc<"inventory"> & { lowStock: boolean }> = items
      .map((i) => ({ ...i, lowStock: i.stock <= i.reorderLevel }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (args.search) {
      const q = args.search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q));
    }
    if (args.lowStockOnly) rows = rows.filter((r) => r.lowStock);
    return rows;
  },
});

export const inventoryStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const items = await ctx.db.query("inventory").collect();
    return {
      totalItems: items.length,
      lowStock: items.filter((i) => i.stock <= i.reorderLevel).length,
      stockValue: items.reduce((sum, i) => sum + i.stock * i.price, 0),
      outOfStock: items.filter((i) => i.stock === 0).length,
    };
  },
});

export const createInventory = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    sku: v.string(),
    stock: v.number(),
    reorderLevel: v.number(),
    unit: v.string(),
    price: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    return await ctx.db.insert("inventory", {
      ...args,
      category: args.category as "supplements",
      updatedAt: Date.now(),
    });
  },
});

export const updateInventory = mutation({
  args: {
    id: v.id("inventory"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    stock: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
    unit: v.optional(v.string()),
    price: v.optional(v.number()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    const { id, ...patch } = args;
    await ctx.db.patch(id, {
      ...patch,
      category: patch.category as "supplements" | undefined,
      updatedAt: Date.now(),
    });
  },
});

/** Adjust stock by a signed delta (e.g. +10 restock, -2 sold). */
export const adjustStock = mutation({
  args: { id: v.id("inventory"), delta: v.number() },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    const newStock = Math.max(0, item.stock + args.delta);
    await ctx.db.patch(args.id, { stock: newStock, updatedAt: Date.now() });
    return newStock;
  },
});

export const removeInventory = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    await requireRole(ctx, [STAFF_ROLES[0], STAFF_ROLES[1]]);
    await ctx.db.delete(args.id);
  },
});