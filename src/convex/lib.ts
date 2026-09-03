import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx } from "./_generated/server";
import { ROLES, Role } from "./schema";

/** Resolve the signed-in user + role, or null when unauthenticated. */
export async function getActor(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;
  return { userId, user, role: (user.role as Role | undefined) ?? null };
}

export const STAFF_ROLES: Role[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF];

/** Throws unless the actor has one of the given roles. */
export async function requireRole(ctx: QueryCtx, allowed: Role[]) {
  const actor = await getActor(ctx);
  if (!actor || !allowed.includes(actor.role ?? ("" as Role))) {
    throw new Error("Forbidden: you do not have permission to perform this action.");
  }
  return actor;
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysFromNow(days: number) {
  return Date.now() + days * 86_400_000;
}

/** Deterministic PRNG for stable demo data. */
export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}