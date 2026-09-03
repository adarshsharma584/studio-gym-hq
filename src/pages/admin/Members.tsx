import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import {
  ExportButton,
  InitialsAvatar,
  PageHeader,
  SearchInput,
  StatusBadge,
  formatDate,
} from "@/components/admin/ui";
import { LogIn, Pencil, Plus, Trash2 } from "lucide-react";

import type { Doc, Id } from "@/convex/_generated/dataModel";
type MemberRow = Doc<"members"> & {
  planName: string;
  planId?: Id<"plans">;
  subStatus: string;
  subEndDate?: number;
  subStartDate?: number;
};
type MemberForm = {
  name: string;
  email: string;
  phone: string;
  gender: string;
  status: string;
  goals: string;
};

const EMPTY_FORM: MemberForm = { name: "", email: "", phone: "", gender: "", status: "active", goals: "" };

function MemberDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: MemberForm;
  onSave: (form: MemberForm, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<MemberForm>(initial);
  const [saving, setSaving] = useState(false);
  const editing = !!initial.name;

  const set = (k: keyof MemberForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit member" : "Add new member"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this member's profile and status." : "Create a member profile. They can be assigned a plan from Subscriptions & Plans."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-name">Full name *</Label>
              <Input id="m-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Aarav Sharma" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-email">Email</Label>
              <Input id="m-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="member@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-phone">Phone</Label>
              <Input id="m-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 …" />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-goals">Goals (comma separated)</Label>
              <Input id="m-goals" value={form.goals} onChange={(e) => set("goals", e.target.value)} placeholder="Fat loss, Cardio" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Members() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [deleting, setDeleting] = useState<MemberRow | null>(null);

  const members = useQuery(api.members.list, { search: search || undefined, status: statusFilter });
  const create = useMutation(api.members.create);
  const update = useMutation(api.members.update);
  const remove = useMutation(api.members.remove);
  const recordVisit = useMutation(api.members.recordVisit);

  const handleSave = async (form: MemberForm, id?: Id<"members">) => {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      gender: form.gender || undefined,
      status: form.status,
      goals: form.goals.split(",").map((g) => g.trim()).filter(Boolean),
    };
    if (id) {
      await update({ id, ...payload });
      toast.success("Member updated");
    } else {
      await create(payload);
      toast.success("Member added");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await remove({ id: deleting._id });
      toast.success(`${deleting.name} removed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
    setDeleting(null);
  };

  const handleVisit = async (m: MemberRow) => {
    await recordVisit({ id: m._id });
    toast.success(`Visit logged for ${m.name}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Management"
        description="Profiles, statuses, plans and check-in activity for everyone at the gym."
        actions={
          <>
            <ExportButton
              rows={(members ?? []).map((m) => ({
                Name: m.name,
                Email: m.email ?? "",
                Phone: m.phone ?? "",
                Status: m.status,
                Plan: m.planName,
                "Plan status": m.subStatus,
                Joined: formatDate(m.joinDate),
                Visits: m.visits,
                "Last visit": formatDate(m.lastVisit),
              }))}
              filename="members.csv"
            />
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="size-4" />
              Add member
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or phone…" className="w-full sm:max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="frozen">Frozen</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardContent className="p-0">
          {!members ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : members.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No members match your filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="hidden sm:table-cell">Visits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={m.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{m.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.email ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm tabular-nums text-muted-foreground md:table-cell">
                      {m.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{m.planName}</span>
                        <StatusBadge status={m.subStatus === "none" ? "no plan" : m.subStatus} label={m.subStatus === "none" ? "No plan" : m.subStatus} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      <div className="flex flex-col gap-1">
                        <span>{formatDate(m.joinDate)}</span>
                        <StatusBadge status={m.status} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm tabular-nums text-muted-foreground sm:table-cell">
                      {m.visits}
                      <span className="block text-xs">{m.lastVisit ? formatDate(m.lastVisit) : "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Log visit" onClick={() => handleVisit(m)}>
                          <LogIn className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 cursor-pointer"
                          title="Edit"
                          onClick={() => { setEditing(m); setDialogOpen(true); }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeleting(m)}>
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

      <MemberDialog
        key={`${editing?._id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing ? {
          name: editing.name,
          email: editing.email ?? "",
          phone: editing.phone ?? "",
          gender: editing.gender ?? "",
          status: editing.status,
          goals: (editing.goals ?? []).join(", "),
        } : EMPTY_FORM}
        onSave={(form) => handleSave(form, editing?._id)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the member profile and their subscriptions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={handleDelete}>
              Delete member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}