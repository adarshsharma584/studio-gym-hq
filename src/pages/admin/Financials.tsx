import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton, PageHeader, SearchInput, StatCard, StatusBadge, formatDate, money } from "@/components/admin/ui";
import { ArrowDownLeft, BadgeCheck, Banknote, IndianRupee, Plus, RotateCcw, Trash2, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type InvoiceRow = Doc<"invoices">;

const trendConfig = {
  revenue: { label: "Revenue", color: "var(--chart-2)" },
} satisfies ChartConfig;

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function CreateInvoiceDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (inv: { memberId: Id<"members">; amount: number; planName: string; method: string }) => Promise<void>;
}) {
  const members = useQuery(api.members.list, { limit: 200 });
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [planName, setPlanName] = useState("");
  const [method, setMethod] = useState("upi");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!memberId || !Number(amount)) return;
    setSaving(true);
    try {
      await onSave({
        memberId: memberId as Id<"members">,
        amount: Number(amount),
        planName: planName.trim() || "Custom charge",
        method,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create invoice</DialogTitle>
          <DialogDescription>Manual charge for PT sessions, recovery add-ons or one-time fees.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {(members ?? []).map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-amount">Amount (₹) *</Label>
              <Input id="inv-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-plan">Plan / description</Label>
            <Input id="inv-plan" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. PT 10-pack" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !memberId || !Number(amount)}>
            {saving ? "Creating…" : "Create invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Financials() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<InvoiceRow | null>(null);

  const summary = useQuery(api.financials.summary);
  const invoices = useQuery(api.financials.listInvoices, { search: search || undefined, status: statusFilter });
  const create = useMutation(api.financials.createInvoice);
  const recordPayment = useMutation(api.financials.recordPayment);
  const refund = useMutation(api.financials.refundInvoice);
  const remove = useMutation(api.financials.removeInvoice);

  const rows = invoices ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financials & Revenue"
        description="Collections, outstanding dues and refunds across every plan and member."
        actions={
          <>
            <ExportButton
              rows={rows.map((i) => ({
                Member: i.memberName,
                Plan: i.planName,
                Amount: i.amount,
                Status: i.status,
                Method: i.method,
                Issued: formatDate(i.issuedAt),
                Paid: formatDate(i.paidAt),
              }))}
              filename="invoices.csv"
            />
            <Button className="cursor-pointer gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Create invoice
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue this month" value={summary ? money(summary.thisMonthRevenue) : "…"} icon={TrendingUp} tone="positive" sub={`${summary?.invoicesThisMonth ?? "—"} invoices issued`} />
        <StatCard label="Total revenue (12 mo)" value={summary ? money(summary.totalRevenue) : "…"} icon={IndianRupee} tone="brand" />
        <StatCard label="Outstanding dues" value={summary ? money(summary.outstanding) : "…"} icon={Banknote} tone="warning" sub="pending invoices" />
        <StatCard label="Refunded" value={summary ? money(summary.refunds) : "…"} icon={RotateCcw} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Collections</CardTitle>
            <p className="text-xs text-muted-foreground">Paid invoices, last 12 months</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-64">
              <BarChart data={summary?.revenueTrend ?? []} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => money(Number(value))} />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Plan</CardTitle>
            <p className="text-xs text-muted-foreground">12-month split</p>
          </CardHeader>
          <CardContent>
            {!summary ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <ChartContainer config={trendConfig} className="h-48">
                  <PieChart>
                    <Pie
                      data={summary.revenueByPlan}
                      dataKey="revenue"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {summary.revenueByPlan.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => money(Number(value))} />} />
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 space-y-1.5">
                  {summary.revenueByPlan.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {p.name}
                      </span>
                      <span className="font-medium tabular-nums">{money(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search member or plan…" className="w-full sm:max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardContent className="p-0">
          {!invoices ? (
            <div className="space-y-3 p-6">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No invoices match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden sm:table-cell">Plan</TableHead>
                  <TableHead className="hidden md:table-cell">Issued</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((i) => (
                  <TableRow key={i._id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{i.memberName}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{i._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{i.planName}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{formatDate(i.issuedAt)}</TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">{money(i.amount)}</TableCell>
                    <TableCell><StatusBadge status={i.status} /></TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground capitalize lg:table-cell">{i.method}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {i.status === "pending" && (
                          <Button variant="outline" size="sm" className="h-8 cursor-pointer gap-1 text-xs" onClick={() => { void recordPayment({ id: i._id }); toast.success("Payment recorded"); }}>
                            <BadgeCheck className="size-3.5" /> Mark paid
                          </Button>
                        )}
                        {i.status !== "refunded" && (
                          <Button variant="outline" size="sm" className="h-8 cursor-pointer gap-1 text-xs" onClick={() => { void refund({ id: i._id }); toast.success("Invoice refunded"); }}>
                            <ArrowDownLeft className="size-3.5" /> Refund
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeleting(i)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        key={`new-${createOpen}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={async (inv) => {
          await create(inv);
          toast.success("Invoice created");
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `${money(deleting.amount)} for ${deleting.memberName} will be permanently removed.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await remove({ id: deleting!._id });
              toast.success("Invoice deleted");
              setDeleting(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}