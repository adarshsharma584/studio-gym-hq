import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, formatDate, formatTime, money } from "@/components/admin/ui";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  IndianRupee,
  PackageX,
  Users,
} from "lucide-react";

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-2)" },
} satisfies ChartConfig;

const memberConfig = {
  members: { label: "New members", color: "var(--chart-1)" },
} satisfies ChartConfig;

function LoadingCard() {
  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function Overview() {
  const data = useQuery(api.dashboard.overview);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <LoadingCard key={i} />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/70 shadow-none lg:col-span-2"><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card className="border-border/70 shadow-none"><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const { kpis, revenueTrend, memberTrend, upcomingList, lowStockList, expiringList } = data;
  const revenueDelta = kpis.lastMonthRevenue > 0
    ? Math.round(((kpis.thisMonthRevenue - kpis.lastMonthRevenue) / kpis.lastMonthRevenue) * 100)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time pulse of the gym — revenue, members, bookings and stock health.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-muted-foreground">Total Revenue (12 mo)</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{money(kpis.totalRevenue)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {revenueDelta === null ? (
                    "this month"
                  ) : revenueDelta >= 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="size-3" /> {revenueDelta}% vs last month
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <ArrowDownRight className="size-3" /> {Math.abs(revenueDelta)}% vs last month
                    </span>
                  )}
                  <span className="text-muted-foreground">· {money(kpis.thisMonthRevenue)} this month</span>
                </p>
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <IndianRupee className="size-[18px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-muted-foreground">Active Members</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{kpis.activeMembers}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="size-3" /> {kpis.newThisMonth} joined
                  </span>{" "}
                  this month · {kpis.totalMembers} total
                </p>
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-[18px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-muted-foreground">Class Bookings (7 days)</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{kpis.classBookings}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {kpis.upcomingClasses} classes scheduled this week
                </p>
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <CalendarClock className="size-[18px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-muted-foreground">Low Stock Items</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{kpis.lowStock}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {kpis.expiringSoon} memberships expiring in 14 days
                </p>
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                <PackageX className="size-[18px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Collected revenue, last 12 months</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-64">
              <AreaChart data={revenueTrend} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => money(Number(value))} />} />
                <Area dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} fill="url(#fillRevenue)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Member Growth</CardTitle>
            <p className="text-xs text-muted-foreground">New sign-ups, last 12 months</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={memberConfig} className="h-64">
              <BarChart data={memberTrend} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="members" fill="var(--color-members)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-none lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Upcoming Classes</CardTitle>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="size-3.5" /> next 7 days
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingList.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No classes scheduled this week.</p>
            ) : (
              <div className="divide-y">
                {upcomingList.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="w-28 shrink-0">
                      <p className="text-[13px] font-medium">{formatDate(c.startTime)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(c.startTime)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.trainer} · {c.facility}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <StatusBadge status={c.status ?? "upcoming"} />
                    </div>
                    <div className="w-28 text-right text-xs tabular-nums text-muted-foreground">
                      {c.booked}/{c.capacity} booked
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {lowStockList.length === 0 && (
                  <p className="px-6 py-6 text-center text-sm text-muted-foreground">All stocked up.</p>
                )}
                {lowStockList.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 px-6 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Reorder at {i.reorderLevel} {i.unit}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-red-600 dark:text-red-400">
                      {i.stock} {i.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Expiring Memberships</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {expiringList.length === 0 && (
                  <p className="px-6 py-6 text-center text-sm text-muted-foreground">Nothing expiring soon.</p>
                )}
                {expiringList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-6 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.memberName}</p>
                      <p className="text-xs text-muted-foreground">{s.planName}</p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatDate(s.endDate)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}