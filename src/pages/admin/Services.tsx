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
import { PageHeader, SearchInput, StatusBadge, formatDate, formatDateTime, formatTime, money } from "@/components/admin/ui";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type FacilityRow = Doc<"facilities"> & { classesThisWeek: number };
type ServiceRow = Doc<"services">;
type ClassRow = Doc<"classes"> & { trainerName: string; facilityName: string };

const toLocalInput = (ts: number) => {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function FacilityDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: FacilityRow | null;
  onSave: (f: { name: string; type: string; capacity: number; description: string }, id?: Id<"facilities">) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "floor");
  const [capacity, setCapacity] = useState(initial ? String(initial.capacity) : "20");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), type, capacity: Number(capacity) || 1, description: description.trim() }, initial?._id);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save facility");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit facility" : "Add facility"}</DialogTitle>
          <DialogDescription>Floors, studios, zones and recovery areas shown on the customer site.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="f-name">Name *</Label>
            <Input id="f-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Group Studio" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="floor">Floor</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="zone">Zone</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-cap">Capacity</Label>
              <Input id="f-cap" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-desc">Description</Label>
            <Textarea id="f-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add facility"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServiceDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ServiceRow | null;
  onSave: (s: { name: string; category: string; description?: string; durationMin?: number; price?: number }, id?: Id<"services">) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "group-class");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial ? String(initial.durationMin ?? "") : "45");
  const [price, setPrice] = useState(initial ? String(initial.price ?? "") : "0");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          durationMin: duration ? Number(duration) : undefined,
          price: price ? Number(price) : undefined,
        },
        initial?._id,
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit service" : "Add service"}</DialogTitle>
          <DialogDescription>Group classes, personal training, recovery and nutrition offerings.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Name *</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HIIT Burn" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group-class">Group class</SelectItem>
                  <SelectItem value="personal-training">Personal training</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-dur">Minutes</Label>
              <Input id="s-dur" type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-price">Price (₹)</Label>
              <Input id="s-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-desc">Description</Label>
            <Textarea id="s-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClassDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ClassRow | null;
  onSave: (c: {
    title: string;
    trainerId?: Id<"trainers">;
    facilityId?: Id<"facilities">;
    startTime: number;
    endTime: number;
    capacity: number;
    booked?: number;
  }, id?: Id<"classes">) => Promise<void>;
}) {
  const trainers = useQuery(api.trainers.list, {});
  const facilities = useQuery(api.facilities.listFacilities, {});
  const [title, setTitle] = useState(initial?.title ?? "");
  const [trainerId, setTrainerId] = useState(initial?.trainerId ?? "");
  const [facilityId, setFacilityId] = useState(initial?.facilityId ?? "");
  const [start, setStart] = useState(initial ? toLocalInput(initial.startTime) : "");
  const [end, setEnd] = useState(initial ? toLocalInput(initial.endTime) : "");
  const [capacity, setCapacity] = useState(initial ? String(initial.capacity) : "20");
  const [booked, setBooked] = useState(initial ? String(initial.booked) : "0");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const startTs = start ? new Date(start).getTime() : NaN;
    const endTs = end ? new Date(end).getTime() : NaN;
    if (!title.trim() || !startTs || !endTs || endTs <= startTs) {
      toast.error("Enter a title and a valid time window");
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          trainerId: (trainerId || undefined) as Id<"trainers"> | undefined,
          facilityId: (facilityId || undefined) as Id<"facilities"> | undefined,
          startTime: startTs,
          endTime: endTs,
          capacity: Number(capacity) || 1,
          booked: Number(booked) || 0,
        },
        initial?._id,
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit class" : "Schedule class"}</DialogTitle>
          <DialogDescription>Assign a trainer, facility and time slot — the schedule drives the member app booking.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-title">Class title *</Label>
            <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HIIT Burn" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Trainer</Label>
              <Select value={trainerId} onValueChange={setTrainerId}>
                <SelectTrigger><SelectValue placeholder="Assign trainer" /></SelectTrigger>
                <SelectContent>
                  {(trainers ?? []).map((t) => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Facility</Label>
              <Select value={facilityId} onValueChange={setFacilityId}>
                <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                <SelectContent>
                  {(facilities ?? []).map((f) => <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-start">Starts</Label>
              <Input id="c-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-end">Ends</Label>
              <Input id="c-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-cap">Capacity</Label>
              <Input id="c-cap" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-booked">Booked so far</Label>
              <Input id="c-booked" type="number" min={0} value={booked} onChange={(e) => setBooked(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Schedule class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Services() {
  const [tab, setTab] = useState("facilities");
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityRow | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<FacilityRow | null>(null);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceRow | null>(null);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRow | null>(null);
  const [classFilter, setClassFilter] = useState("");

  const facilities = useQuery(api.facilities.listFacilities);
  const services = useQuery(api.facilities.listServices);
  const classes = useQuery(api.facilities.listClasses, {});
  const createFacility = useMutation(api.facilities.createFacility);
  const updateFacility = useMutation(api.facilities.updateFacility);
  const removeFacility = useMutation(api.facilities.removeFacility);
  const createService = useMutation(api.facilities.createService);
  const updateService = useMutation(api.facilities.updateService);
  const removeService = useMutation(api.facilities.removeService);
  const createClass = useMutation(api.facilities.createClass);
  const updateClass = useMutation(api.facilities.updateClass);
  const removeClass = useMutation(api.facilities.removeClass);

  const filteredClasses = (classes ?? []).filter(
    (c) =>
      !classFilter ||
      c.title.toLowerCase().includes(classFilter.toLowerCase()) ||
      c.trainerName.toLowerCase().includes(classFilter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services & Facilities"
        description="Gym spaces, service catalog and the class schedule with trainer assignments."
        actions={
          tab === "facilities" ? (
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditingFacility(null); setFacilityDialogOpen(true); }}>
              <Plus className="size-4" /> Add facility
            </Button>
          ) : tab === "services" ? (
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditingService(null); setServiceDialogOpen(true); }}>
              <Plus className="size-4" /> Add service
            </Button>
          ) : (
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditingClass(null); setClassDialogOpen(true); }}>
              <Plus className="size-4" /> Schedule class
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="classes">Class schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities" className="mt-4">
          {!facilities ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {facilities.map((f) => (
                <Card key={f._id} className="border-border/70 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <MapPin className="size-4" />
                        </div>
                        <CardTitle className="text-base">{f.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-7 cursor-pointer" title="Edit" onClick={() => { setEditingFacility(f); setFacilityDialogOpen(true); }}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 cursor-pointer text-destructive" title="Delete" onClick={() => setDeletingFacility(f)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="font-normal capitalize">{f.type}</Badge>
                      <StatusBadge status={f.status} />
                    </div>
                    <p className="mt-2 text-[13px] text-muted-foreground">{f.description}</p>
                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span>Capacity {f.capacity}</span>
                      <span><span className="font-medium tabular-nums text-foreground">{f.classesThisWeek}</span> classes this week</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardContent className="p-0">
              {!services ? (
                <div className="space-y-3 p-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead className="hidden md:table-cell">Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{s.name}</span>
                            <span className="max-w-md truncate text-xs text-muted-foreground">{s.description}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="font-normal capitalize">{s.category.replace("-", " ")}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {s.durationMin ? `${s.durationMin} min` : "—"}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{s.price ? money(s.price) : "Included"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">{s.active ? "Active" : "Hidden"}</span>
                              <Switch
                                checked={s.active}
                                onCheckedChange={(v) => {
                                  void updateService({ id: s._id, active: v });
                                  toast.success(`${s.name} ${v ? "shown" : "hidden"} on site`);
                                }}
                              />
                            </div>
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditingService(s); setServiceDialogOpen(true); }}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeletingService(s)}>
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
        </TabsContent>

        <TabsContent value="classes" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={classFilter} onChange={setClassFilter} placeholder="Filter by class or trainer…" className="w-full sm:max-w-xs" />
            <span className="text-xs text-muted-foreground">
              {filteredClasses.length} classes · next 14 days
            </span>
          </div>
          <Card className="border-border/70 shadow-none">
            <CardContent className="p-0">
              {!classes ? (
                <div className="space-y-3 p-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filteredClasses.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No classes match.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead className="hidden sm:table-cell">Trainer</TableHead>
                      <TableHead className="hidden lg:table-cell">Facility</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead className="hidden md:table-cell">Bookings</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell>
                          <span className="text-sm font-medium">{c.title}</span>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{c.trainerName}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{c.facilityName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm tabular-nums">{formatDate(c.startTime)} · {formatTime(c.startTime)}</span>
                            <StatusBadge status={c.status ?? "upcoming"} />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className={c.booked >= c.capacity ? "h-full bg-red-500" : "h-full bg-emerald-500"}
                                style={{ width: `${Math.min(100, (c.booked / c.capacity) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">{c.booked}/{c.capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditingClass(c); setClassDialogOpen(true); }}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeletingClass(c)}>
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
        </TabsContent>
      </Tabs>

      <FacilityDialog
        key={`${editingFacility?._id ?? "new"}-${facilityDialogOpen}`}
        open={facilityDialogOpen}
        onOpenChange={setFacilityDialogOpen}
        initial={editingFacility}
        onSave={async (f, id) => {
          if (id) {
            await updateFacility({ id, name: f.name, capacity: f.capacity, description: f.description });
            toast.success("Facility updated");
          } else {
            await createFacility(f);
            toast.success("Facility added");
          }
        }}
      />
      <ServiceDialog
        key={`${editingService?._id ?? "new"}-${serviceDialogOpen}`}
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        initial={editingService}
        onSave={async (s, id) => {
          if (id) {
            await updateService({ id, ...s });
            toast.success("Service updated");
          } else {
            await createService(s);
            toast.success("Service added");
          }
        }}
      />
      <ClassDialog
        key={`${editingClass?._id ?? "new"}-${classDialogOpen}`}
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        initial={editingClass}
        onSave={async (c, id) => {
          if (id) {
            await updateClass({ id, ...c });
            toast.success("Class updated");
          } else {
            await createClass(c);
            toast.success("Class scheduled");
          }
        }}
      />

      <AlertDialog open={!!deletingFacility} onOpenChange={(v) => !v && setDeletingFacility(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingFacility?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Classes in this facility will be unassigned. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await removeFacility({ id: deletingFacility!._id });
              toast.success("Facility deleted");
              setDeletingFacility(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingService} onOpenChange={(v) => !v && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingService?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the service from the catalog. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await removeService({ id: deletingService!._id });
              toast.success("Service deleted");
              setDeletingService(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingClass} onOpenChange={(v) => !v && setDeletingClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingClass?.title}?</AlertDialogTitle>
            <AlertDialogDescription>Removes this class from the schedule. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await removeClass({ id: deletingClass!._id });
              toast.success("Class deleted");
              setDeletingClass(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}