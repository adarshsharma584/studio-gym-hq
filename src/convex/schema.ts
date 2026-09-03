import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// ---------------------------------------------------------------------------
// Roles — role-based access (Super Admin / Admin / Staff / Member)
// ---------------------------------------------------------------------------
export const ROLES = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  STAFF: "staff",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.SUPER_ADMIN),
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.STAFF),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const MEMBER_STATUS = v.union(
  v.literal("active"),
  v.literal("frozen"),
  v.literal("expired"),
  v.literal("lead"),
);
export type MemberStatus = Infer<typeof MEMBER_STATUS>;

export const SUB_STATUS = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("expired"),
  v.literal("cancelled"),
);
export type SubscriptionStatus = Infer<typeof SUB_STATUS>;

export const INVOICE_STATUS = v.union(
  v.literal("paid"),
  v.literal("pending"),
  v.literal("failed"),
  v.literal("refunded"),
);
export type InvoiceStatus = Infer<typeof INVOICE_STATUS>;

export const CLASS_STATUS = v.union(
  v.literal("live"),
  v.literal("upcoming"),
  v.literal("full"),
  v.literal("done"),
  v.literal("cancelled"),
);
export type ClassStatus = Infer<typeof CLASS_STATUS>;

export const EQUIPMENT_STATUS = v.union(
  v.literal("operational"),
  v.literal("maintenance"),
  v.literal("repair"),
  v.literal("retired"),
);
export type EquipmentStatus = Infer<typeof EQUIPMENT_STATUS>;

const schema = defineSchema(
  {
    // default auth tables using convex auth (do not remove or modify)
    ...authTables,

    // users table is managed by convex auth; role drives access control
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // -----------------------------------------------------------------------
    // PEOPLE
    // -----------------------------------------------------------------------
    members: defineTable({
      userId: v.optional(v.id("users")),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      gender: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      joinDate: v.number(),
      status: MEMBER_STATUS,
      visits: v.number(),
      lastVisit: v.optional(v.number()),
      goals: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })
      .index("by_status", ["status"])
      .index("by_joinDate", ["joinDate"]),

    trainers: defineTable({
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
      active: v.boolean(),
      hiredAt: v.number(),
    }),

    // -----------------------------------------------------------------------
    // BUSINESS — plans, subscriptions, schedule, services, facilities
    // -----------------------------------------------------------------------
    plans: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(), // monthly-equivalent ₹
      billingCycle: v.union(
        v.literal("monthly"),
        v.literal("quarterly"),
        v.literal("half-yearly"),
        v.literal("annual"),
        v.literal("one-time"),
      ),
      durationMonths: v.number(),
      features: v.array(v.string()),
      popular: v.boolean(),
      active: v.boolean(),
    }),

    subscriptions: defineTable({
      memberId: v.id("members"),
      planId: v.id("plans"),
      planName: v.string(),
      price: v.number(),
      startDate: v.number(),
      endDate: v.number(),
      status: SUB_STATUS,
      paymentMethod: v.optional(v.string()),
    })
      .index("by_member", ["memberId"])
      .index("by_status", ["status"])
      .index("by_endDate", ["endDate"]),

    classes: defineTable({
      title: v.string(),
      trainerId: v.optional(v.id("trainers")),
      facilityId: v.optional(v.id("facilities")),
      day: v.number(), // epoch ms at local midnight of the session day
      startTime: v.number(), // epoch ms
      endTime: v.number(), // epoch ms
      capacity: v.number(),
      booked: v.number(),
      notes: v.optional(v.string()),
      status: v.optional(CLASS_STATUS), // manual override; auto-derived otherwise
    })
      .index("by_day", ["day"])
      .index("by_trainer", ["trainerId"]),

    facilities: defineTable({
      name: v.string(),
      type: v.union(
        v.literal("floor"),
        v.literal("studio"),
        v.literal("zone"),
        v.literal("recovery"),
      ),
      capacity: v.number(),
      description: v.optional(v.string()),
      status: v.union(v.literal("open"), v.literal("maintenance"), v.literal("closed")),
    }),

    services: defineTable({
      name: v.string(),
      category: v.union(
        v.literal("group-class"),
        v.literal("personal-training"),
        v.literal("recovery"),
        v.literal("nutrition"),
        v.literal("membership"),
      ),
      description: v.optional(v.string()),
      durationMin: v.optional(v.number()),
      price: v.optional(v.number()),
      active: v.boolean(),
    }),

    // -----------------------------------------------------------------------
    // EQUIPMENT & INVENTORY
    // -----------------------------------------------------------------------
    equipment: defineTable({
      name: v.string(),
      category: v.union(
        v.literal("cardio"),
        v.literal("strength"),
        v.literal("free-weights"),
        v.literal("recovery"),
        v.literal("functional"),
      ),
      facilityId: v.optional(v.id("facilities")),
      serial: v.optional(v.string()),
      purchaseDate: v.optional(v.number()),
      lastMaintenance: v.optional(v.number()),
      nextMaintenance: v.optional(v.number()),
      status: EQUIPMENT_STATUS,
    })
      .index("by_status", ["status"])
      .index("by_facility", ["facilityId"]),

    inventory: defineTable({
      name: v.string(),
      category: v.union(
        v.literal("supplements"),
        v.literal("merch"),
        v.literal("retail"),
        v.literal("consumables"),
      ),
      sku: v.string(),
      stock: v.number(),
      reorderLevel: v.number(),
      unit: v.string(),
      price: v.number(),
      location: v.optional(v.string()),
      updatedAt: v.optional(v.number()),
    }),

    // -----------------------------------------------------------------------
    // CONTENT — pushed to customer UI
    // -----------------------------------------------------------------------
    banners: defineTable({
      title: v.string(),
      image: v.optional(v.string()),
      ctaLabel: v.optional(v.string()),
      ctaLink: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      position: v.number(),
      active: v.boolean(),
    }),

    reels: defineTable({
      title: v.string(),
      videoUrl: v.optional(v.string()),
      cover: v.optional(v.string()),
      durationSec: v.optional(v.number()),
      visible: v.boolean(),
      order: v.number(),
    }),

    announcements: defineTable({
      title: v.string(),
      body: v.string(),
      audience: v.union(v.literal("all"), v.literal("members"), v.literal("staff")),
      priority: v.union(v.literal("normal"), v.literal("important"), v.literal("urgent")),
      startsAt: v.number(),
      endsAt: v.optional(v.number()),
      active: v.boolean(),
    }),

    posts: defineTable({
      title: v.string(),
      type: v.union(v.literal("blog"), v.literal("gallery")),
      excerpt: v.optional(v.string()),
      body: v.optional(v.string()),
      image: v.optional(v.string()),
      published: v.boolean(),
      publishedAt: v.optional(v.number()),
    }),

    // -----------------------------------------------------------------------
    // FINANCIALS
    // -----------------------------------------------------------------------
    invoices: defineTable({
      memberId: v.id("members"),
      memberName: v.string(),
      subscriptionId: v.optional(v.id("subscriptions")),
      planName: v.string(),
      amount: v.number(),
      status: INVOICE_STATUS,
      issuedAt: v.number(),
      paidAt: v.optional(v.number()),
      method: v.union(v.literal("upi"), v.literal("card"), v.literal("cash"), v.literal("bank")),
    })
      .index("by_issuedAt", ["issuedAt"])
      .index("by_status", ["status"])
      .index("by_member", ["memberId"]),

    // -----------------------------------------------------------------------
    // NOTIFICATIONS
    // -----------------------------------------------------------------------
    notifications: defineTable({
      title: v.string(),
      body: v.string(),
      channels: v.array(v.union(v.literal("push"), v.literal("email"), v.literal("sms"))),
      audienceSegment: v.union(
        v.literal("all"),
        v.literal("inactive30"),
        v.literal("expiring"),
        v.literal("newMembers"),
        v.literal("noPlan"),
      ),
      status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sent")),
      recipientCount: v.optional(v.number()),
      sendAt: v.optional(v.number()),
      sentAt: v.optional(v.number()),
      createdBy: v.optional(v.string()),
    }),

    // -----------------------------------------------------------------------
    // SYSTEM SETTINGS (single doc with id "default")
    // -----------------------------------------------------------------------
    settings: defineTable({
      seededAt: v.optional(v.number()),
      gym: v.object({
        name: v.string(),
        tagline: v.string(),
        address: v.string(),
        city: v.string(),
        phone: v.string(),
        email: v.string(),
        hours: v.object({
          weekdays: v.string(),
          saturday: v.string(),
          sunday: v.string(),
        }),
      }),
      paymentGateway: v.object({
        provider: v.union(v.literal("stripe"), v.literal("razorpay")),
        stripePublishableKey: v.optional(v.string()),
        stripeSecretKey: v.optional(v.string()),
        razorpayKeyId: v.optional(v.string()),
        razorpayKeySecret: v.optional(v.string()),
        currency: v.string(),
      }),
      smtp: v.object({
        host: v.optional(v.string()),
        port: v.optional(v.number()),
        user: v.optional(v.string()),
        password: v.optional(v.string()),
        fromName: v.optional(v.string()),
        fromEmail: v.optional(v.string()),
        secure: v.optional(v.boolean()),
      }),
      rolePermissions: v.record(v.string(), v.array(v.string())),
      staffInvites: v.array(
        v.object({
          email: v.string(),
          role: roleValidator,
          invitedAt: v.number(),
        }),
      ),
    }),
  },
  {
    schemaValidation: false,
  },
);

export default schema;