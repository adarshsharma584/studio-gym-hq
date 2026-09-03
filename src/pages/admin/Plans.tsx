import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
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
import {
  ExportButton,
  InitialsAvatar,
  PageHeader,
  SearchInput,
  StatusBadge,
  formatDate,
  money,
} from "@/components/admin/ui";
import { CalendarPlus, Crown, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type PlanRow = Doc<"plans"> & { activeSubscribers: number };
type SubRow = Doc<"subscriptions"> & { memberName: string; memberStatus: string };

const CYCLES = ["monthly", "quarterly", "half-yearly", "annual", "one-time"] as const;

function PlanDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: PlanRow | null;
  onSave: (plan: {
    name: string;
    description?: string;
    price: number;
    billingCycle: string;
    durationMonths: number;
    features: string[];
    popular: boolean;
  }, id?: Id<"plans">) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [cycle, setCycle] = useState<string>(initial?.billingCycle ?? "monthly");
  const [duration, setDuration] = useState(initial ? String(initial.durationMonths) : "1");
  const [features, setFeatures] = useState(initial?.features.join("\n") ?? "");
  const [popular, setPopular] = useState(initial?.popular ?? false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const priceNum = Number(price);
    if (!name.trim() || !priceNum) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceNum,
          billingCycle: cycle,
          durationMonths: Number(duration) || 1,
          features: features.split("\n").map((f) => f.trim()).filter(Boolean),
          popular,
        },
        initial?._id,
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit plan" : "Create plan"}</DialogTitle>
          <DialogDescription>Pricing and features that drive subscriptions and customer-site plan cards.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Plan name *</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Elite" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Price (₹) *</Label>
              <Input id="p-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Billing cycle</Label>
              <Select value={cycle} onValueChange={setCycle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CYCLES.map((c) => <SelectItem key={c} value={c}>{c.replace("-", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-dur">Duration (months)</Label>
              <Input id="p-dur" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Input id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-feat">Features (one per line)</Label>
            <Textarea id="p-feat" rows={4} value={features} onChange={(e) => setFeatures(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Mark as popular</p>
              <p className="text-xs text-muted-foreground">Highlights this plan on the customer site</p>
            </div>
            <Switch checked={popular} onCheckedChange={setPopular} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !name.trim() || !price}>
            {saving ? "Saving…" : initial ? "Save changes" : "Create plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (memberId: Id<"members">, planId: Id<"plans">, startDate: number, months: number, paymentMethod: string) => Promise<void>;
}) {
  const members = useQuery(api.members.list, { status: "active", limit: 200 });
  const plans = useQuery(api.plans.listPlans);
  const [memberId, setMemberId] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");
  const [months, setMonths] = useState("1");
  const [method, setMethod] = useState("UPI");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!memberId || !planId) return;
    setSaving(true);
    try {
      await onSave(memberId as Id<"members">, planId as Id<"plans">, Date.now(), Number(months), method);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign plan to member</DialogTitle>
          <DialogDescription>Creates a subscription and issues an invoice for the plan price.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger><SelectValue placeholder="Select active member" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {(members ?? []).map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
              <SelectContent>
                {(plans ?? []).filter((p) => p.active).map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.name} — {money(p.price)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["1", "3", "6", "12"].map((m) => <SelectItem key={m} value={m}>{m} month{m === "1" ? "" : "s"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["UPI", "Card", "Cash", "Bank Transfer"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !memberId || !planId}>
            {saving ? "Assigning…" : "Assign plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenewDialog({
  sub,
  onClose,
}: {
  sub: SubRow;
  onClose: () => void;
}) {
  const renew = useMutation(api.plans.renewSubscription);
  const [months, setMonths] = useState("3");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await renew({ id: sub._id, months: Number(months) });
      toast.success(`${sub.memberName}'s ${sub.planName} renewed +${months} months`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Renewal failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Renew {sub.planName}</DialogTitle>
          <DialogDescription>
            {sub.memberName} · currently expires {formatDate(sub.endDate)}. Renewal issues a new invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label>Extend by</Label>
          <Select value={months} onValueChange={setMonths}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["1", "3", "6", "12"].map((m) => <SelectItem key={m} value={m}>{m} month{m === "1" ? "" : "s"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={onClose}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving}>
            {saving ? "Renewing…" : "Renew & invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Plans() {
  const [tab, setTab] = useState("plans");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<PlanRow | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [renewing, setRenewing] = useState<SubRow | null>(null);

  const plans = useQuery(api.plans.listPlans);
  const subs = useQuery(api.plans.listSubscriptions, { search: search || undefined, status: statusFilter });
  const createPlan = useMutation(api.plans.createPlan);
  const updatePlan = useMutation(api.plans.updatePlan);
  const removePlan = useMutation(api.plans.removePlan);
  const createSubscription = useMutation(api.plans.createSubscription);
  const updateSubscription = useMutation(api.plans.updateSubscription);

  const handleSavePlan = async (plan: { name: string; description?: string; price: number; billingCycle: string; durationMonths: number; features: string[]; popular: boolean }, id?: Id<"plans">) => {
    if (id) {
      await updatePlan({ id, ...plan, description: plan.description || undefined });
      toast.success("Plan updated");
    } else {
      await createPlan(plan);
      toast.success("Plan created");
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    try {
      await removePlan({ id: deletingPlan._id });
      toast.success("Plan deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
    setDeletingPlan(null);
  };

  const handleSetSubStatus = async (s: SubRow, status: string) => {
    await updateSubscription({ id: s._id, status });
    toast.success(`${s.memberName}'s subscription ${status}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions & Plans"
        description="Plan catalog, pricing and every member subscription with renewal tracking."
        actions={
          <Button className="cursor-pointer gap-1.5" onClick={() => setAssignOpen(true)}>
            <CalendarPlus className="size-4" />
            Assign plan
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="cursor-pointer gap-1.5" onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }}>
              <Plus className="size-3.5" />
              New plan
            </Button>
          </div>
          {!plans ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {plans.map((p) => (
                <Card key={p._id} className={p.popular ? "border-primary/40 shadow-none" : "border-border/70 shadow-none"}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{p.name}</CardTitle>
                          {p.popular && (
                            <Badge className="gap-1 border-transparent bg-primary text-primary-foreground">
                              <Crown className="size-3" /> Popular
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditingPlan(p); setPlanDialogOpen(true); }}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeletingPlan(p)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tracking-tight">{money(p.price)}</span>
                      <span className="text-xs text-muted-foreground">/ {p.billingCycle.replace("-", " ")}</span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                          <span className="size-1 shrink-0 rounded-full bg-primary/60" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span><span className="font-medium tabular-nums text-foreground">{p.activeSubscribers}</span> active subscribers</span>
                      <div className="flex items-center gap-2">
                        <span>{p.active ? "Active" : "Archived"}</span>
                        <Switch
                          checked={p.active}
                          onCheckedChange={(v) => {
                            void updatePlan({ id: p._id, active: v });
                            toast.success(`${p.name} ${v ? "activated" : "archived"}`);
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search member or plan…" className="w-full sm:max-w-xs" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="sm:ml-auto">
              <ExportButton
                rows={(subs ?? []).map((s) => ({
                  Member: s.memberName,
                  Plan: s.planName,
                  Price: s.price,
                  Start: formatDate(s.startDate),
                  End: formatDate(s.endDate),
                  Status: s.status,
                  Method: s.paymentMethod ?? "",
                }))}
                filename="subscriptions.csv"
              />
            </div>
          </div>

          <Card className="border-border/70 shadow-none">
            <CardContent className="p-0">
              {!subs ? (
                <div className="space-y-3 p-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : subs.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No subscriptions match.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="hidden md:table-cell">Start</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="hidden sm:table-cell">Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subs.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={s.memberName} />
                            <div>
                              <p className="text-sm font-medium">{s.memberName}</p>
                              <p className="text-xs text-muted-foreground capitalize">{s.memberStatus}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{s.planName}</span>
                            <StatusBadge status={s.status} />
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{formatDate(s.startDate)}</TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatDate(s.endDate)}
                          {s.status === "active" && s.endDate < Date.now() + 14 * 86_400_000 && (
                            <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">expiring</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{s.paymentMethod ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 cursor-pointer gap-1 text-xs" onClick={() => setRenewing(s)}>
                              <RefreshCcw className="size-3.5" />
                              Renew
                            </Button>
                            {s.status === "active" ? (
                              <Button variant="ghost" size="sm" className="h-8 cursor-pointer text-xs" onClick={() => handleSetSubStatus(s, "paused")}>
                                Pause
                              </Button>
                            ) : s.status === "paused" ? (
                              <Button variant="ghost" size="sm" className="h-8 cursor-pointer text-xs" onClick={() => handleSetSubStatus(s, "active")}>
                                Resume
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-8 cursor-pointer text-xs" onClick={() => handleSetSubStatus(s, "active")}>
                                Re-activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PlanDialog
        key={`${editingPlan?._id ?? "new"}-${planDialogOpen}`}
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        initial={editingPlan}
        onSave={handleSavePlan}
      />

      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} onSave={async (memberId, planId, startDate, months, method) => {
        await createSubscription({
          memberId,
          planId,
          startDate,
          endDate: startDate + months * 30 * 86_400_000,
          paymentMethod: method,
        });
        toast.success("Plan assigned — invoice issued");
      }} />

      {renewing && <RenewDialog sub={renewing} onClose={() => setRenewing(null)} />}

      <AlertDialog open={!!deletingPlan} onOpenChange={(v) => !v && setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingPlan?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Plans with existing subscriptions can't be deleted — archive them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={handleDeletePlan}>
              Delete plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}