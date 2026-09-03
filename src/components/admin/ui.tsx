import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
export function money(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function formatDate(ts?: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(ts?: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(ts?: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeDays(ts: number) {
  const diff = ts - Date.now();
  const days = Math.round(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: LucideIcon;
  tone?: "default" | "positive" | "warning" | "danger" | "brand";
}) {
  const tones: Record<string, string> = {
    default: "bg-muted text-foreground",
    positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400",
    brand: "bg-primary/10 text-primary",
  };
  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="size-[18px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Search input
// ---------------------------------------------------------------------------
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
export function downloadCSV(rows: Array<Record<string, unknown>>, filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ rows, filename }: { rows: Array<Record<string, unknown>>; filename: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="cursor-pointer gap-1.5"
      onClick={() => downloadCSV(rows, filename)}
      disabled={rows.length === 0}
    >
      <Download className="size-3.5" />
      Export
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Status badges
// ---------------------------------------------------------------------------
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  operational: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  open: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  live: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  visible: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  sent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  upcoming: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-transparent",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-transparent",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  frozen: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  paused: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  maintenance: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  repair: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  important: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  expired: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-transparent",
  cancelled: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-transparent",
  retired: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-transparent",
  closed: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-transparent",
  done: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-transparent",
  draft: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-transparent",
  lead: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-transparent",
  full: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent",
  failed: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent",
  refunded: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent",
  urgent: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent",
  critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[status] ?? "text-muted-foreground")}>
      {label ?? status}
    </Badge>
  );
}

/** Initials avatar fallback when no image is present. */
export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary",
        className,
      )}
    >
      {initials}
    </div>
  );
}