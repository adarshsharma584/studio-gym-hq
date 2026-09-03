import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ExportButton, PageHeader, SearchInput, StatCard, StatusBadge, formatDate } from "@/components/admin/ui";
import { AlertTriangle, CheckCircle2, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type EquipmentRow = Doc<"equipment"> & {
  facilityName: string;
  maintenanceDue: boolean;
  effectiveStatus: string;
};

const CATEGORIES = ["cardio", "strength", "free-weights", "recovery", "functional"] as const;

function EquipmentDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: EquipmentRow | null;
  onSave: (e: {
    name: string;
    category: string;
    facilityId?: Id<"facilities">;
    serial?: string;
    purchaseDate?: number;
    nextMaintenance?: number;
  }, id?: Id<"equipment">) => Promise<void>;
}) {
  const facilities = useQuery(api.facilities.listFacilities);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "cardio");
  const [facilityId, setFacilityId] = useState(initial?.facilityId ?? "");
  const [serial, setSerial] = useState(initial?.serial ?? "");
  const [nextMaint, setNextMaint] = useState(
    initial?.nextMaintenance ? new Date(initial.nextMaintenance).toISOString().slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          facilityId: (facilityId || undefined) as Id<"facilities"> | undefined,
          serial: serial.trim() || undefined,
          nextMaintenance: nextMaint ? new Date(nextMaint).getTime() : undefined,
        },
        initial?._id,
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save equipment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit equipment" : "Add equipment"}</DialogTitle>
          <DialogDescription>
            Items are flagged for maintenance automatically when their service date passes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="e-name">Name *</Label>
            <Input id="e-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Treadmill — Technogym Run" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("-", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Facility</Label>
              <Select value={facilityId} onValueChange={setFacilityId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(facilities ?? []).map((f) => <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-serial">Serial no.</Label>
              <Input id="e-serial" value={serial} onChange={(e) => setSerial(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-maint">Next maintenance</Label>
              <Input id="e-maint" type="date" value={nextMaint} onChange={(e) => setNextMaint(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add equipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Equipment() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentRow | null>(null);
  const [deleting, setDeleting] = useState<EquipmentRow | null>(null);

  const equipment = useQuery(api.equipment.listEquipment, { search: search || undefined, status: statusFilter });
  const create = useMutation(api.equipment.createEquipment);
  const update = useMutation(api.equipment.updateEquipment);
  const remove = useMutation(api.equipment.removeEquipment);
  const markMaintained = useMutation(api.equipment.markMaintained);

  const items = equipment ?? [];
  const operational = items.filter((i) => i.effectiveStatus === "operational").length;
  const inMaintenance = items.filter((i) => i.effectiveStatus === "maintenance" || i.effectiveStatus === "repair").length;
  const due = items.filter((i) => i.maintenanceDue).length;

  const handleSave = async (e: { name: string; category: string; facilityId?: Id<"facilities">; serial?: string; nextMaintenance?: number }, id?: Id<"equipment">) => {
    if (id) {
      await update({ id, ...e });
      toast.success("Equipment updated");
    } else {
      await create(e);
      toast.success("Equipment added");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Management"
        description="Machines, racks and recovery gear with automatic maintenance scheduling."
        actions={
          <>
            <ExportButton
              rows={items.map((i) => ({
                Name: i.name,
                Category: i.category,
                Facility: i.facilityName,
                Serial: i.serial ?? "",
                Status: i.effectiveStatus,
                "Last maintenance": formatDate(i.lastMaintenance),
                "Next maintenance": formatDate(i.nextMaintenance),
              }))}
              filename="equipment.csv"
            />
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="size-4" /> Add equipment
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total items" value={items.length} icon={Wrench} />
        <StatCard label="Operational" value={operational} icon={CheckCircle2} tone="positive" />
        <StatCard label="In maintenance" value={inMaintenance} icon={Wrench} tone="warning" />
        <StatCard label="Service due" value={due} icon={AlertTriangle} tone={due > 0 ? "danger" : "default"} sub="past next-maintenance date" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or serial…" className="w-full sm:max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardContent className="p-0">
          {!equipment ? (
            <div className="space-y-3 p-6">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No equipment found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Facility</TableHead>
                  <TableHead className="hidden md:table-cell">Last service</TableHead>
                  <TableHead className="hidden md:table-cell">Next service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i._id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{i.name}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{i.serial ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground capitalize sm:table-cell">{i.category.replace("-", " ")}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{i.facilityName}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{formatDate(i.lastMaintenance)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`text-sm tabular-nums ${i.maintenanceDue ? "font-medium text-red-500" : "text-muted-foreground"}`}>
                        {formatDate(i.nextMaintenance)}
                        {i.maintenanceDue && <span className="ml-1.5 text-[10px] font-semibold uppercase">overdue</span>}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={i.effectiveStatus} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {(i.effectiveStatus === "maintenance" || i.effectiveStatus === "repair") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 cursor-pointer gap-1 text-xs"
                            onClick={() => {
                              void markMaintained({ id: i._id });
                              toast.success(`${i.name} marked operational`);
                            }}
                          >
                            <CheckCircle2 className="size-3.5" /> Serviced
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditing(i); setDialogOpen(true); }}>
                          <Pencil className="size-4" />
                        </Button>
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

      <EquipmentDialog
        key={`${editing?._id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the equipment record. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await remove({ id: deleting!._id });
              toast.success("Equipment removed");
              setDeleting(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}