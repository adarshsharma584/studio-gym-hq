import { query } from "./_generated/server";
import { requireRole, STAFF_ROLES } from "./lib";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, STAFF_ROLES);
    const now = Date.now();
    const dayMs = 86_400_000;

    const [members, subs, invoices, classes, inventory, trainers, facilities] = await Promise.all([
      ctx.db.query("members").collect(),
      ctx.db.query("subscriptions").collect(),
      ctx.db.query("invoices").collect(),
      ctx.db.query("classes").collect(),
      ctx.db.query("inventory").collect(),
      ctx.db.query("trainers").collect(),
      ctx.db.query("facilities").collect(),
    ]);

    // ---- KPI totals --------------------------------------------------------
    const activeMembers = members.filter((m) => m.status === "active").length;
    const newThisMonth = members.filter((m) => m.joinDate >= now - 30 * dayMs).length;

    const monthKey = (ts: number) => {
      const d = new Date(ts);
      return `${d.getFullYear()}-${d.getMonth()}`;
    };
    const thisMonth = monthKey(now);
    const lastMonth = monthKey(now - 30 * dayMs);

    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    const revenueByMonth: Record<string, number> = {};
    for (const inv of invoices) {
      if (inv.status === "paid" && inv.paidAt) {
        totalRevenue += inv.amount;
        const k = monthKey(inv.issuedAt);
        revenueByMonth[k] = (revenueByMonth[k] ?? 0) + inv.amount;
        if (k === thisMonth) thisMonthRevenue += inv.amount;
        if (k === lastMonth) lastMonthRevenue += inv.amount;
      }
    }

    const upcomingClasses = classes.filter((c) => c.startTime > now && c.startTime < now + 7 * dayMs);
    const classBookings = upcomingClasses.reduce((sum, c) => sum + c.booked, 0);

    const lowStockItems = inventory.filter((i) => i.stock <= i.reorderLevel);
    const expiring = subs.filter((s) => s.status === "active" && s.endDate < now + 14 * dayMs);
    const outstanding = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);

    // ---- Chart series (12 months) ------------------------------------------
    const revenueTrend: Array<{ month: string; revenue: number }> = [];
    const memberTrend: Array<{ month: string; members: number }> = [];
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - m, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      revenueTrend.push({ month: MONTHS[d.getMonth()], revenue: revenueByMonth[k] ?? 0 });
      memberTrend.push({
        month: MONTHS[d.getMonth()],
        members: members.filter((mm) => mm.joinDate >= start && mm.joinDate < end).length,
      });
    }

    // ---- Upcoming classes with names ----------------------------------------
    const trainerMap = new Map(trainers.map((t) => [t._id, t.name]));
    const facilityMap = new Map(facilities.map((f) => [f._id, f.name]));
    const upcomingList = upcomingClasses
      .map((c) => ({
        id: c._id,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        trainer: c.trainerId ? trainerMap.get(c.trainerId) ?? "Unassigned" : "Unassigned",
        facility: c.facilityId ? facilityMap.get(c.facilityId) ?? "—" : "—",
        booked: c.booked,
        capacity: c.capacity,
        status: c.status,
      }))
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 8);

    const expiringList = expiring
      .map((s) => ({
        id: s._id,
        memberName: members.find((m) => m._id === s.memberId)?.name ?? "Unknown",
        planName: s.planName,
        endDate: s.endDate,
      }))
      .sort((a, b) => a.endDate - b.endDate)
      .slice(0, 5);

    const recentInvoices = invoices
      .sort((a, b) => b.issuedAt - a.issuedAt)
      .slice(0, 6)
      .map((i) => ({
        id: i._id,
        memberName: i.memberName,
        planName: i.planName,
        amount: i.amount,
        status: i.status,
        issuedAt: i.issuedAt,
      }));

    const statusBreakdown = {
      active: members.filter((m) => m.status === "active").length,
      frozen: members.filter((m) => m.status === "frozen").length,
      expired: members.filter((m) => m.status === "expired").length,
      lead: members.filter((m) => m.status === "lead").length,
    };

    return {
      kpis: {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        activeMembers,
        newThisMonth,
        upcomingClasses: upcomingClasses.length,
        classBookings,
        lowStock: lowStockItems.length,
        expiringSoon: expiring.length,
        outstanding,
        totalMembers: members.length,
        totalTrainers: trainers.filter((t) => t.active).length,
      },
      revenueTrend,
      memberTrend,
      upcomingList,
      expiringList,
      recentInvoices,
      lowStockList: lowStockItems
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5)
        .map((i) => ({ id: i._id, name: i.name, stock: i.stock, reorderLevel: i.reorderLevel, unit: i.unit })),
      statusBreakdown,
    };
  },
});