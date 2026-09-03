import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar, PageHeader, SearchInput, StatusBadge } from "@/components/admin/ui";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type TrainerRow = Doc<"trainers"> & { upcomingClasses: number; classesThisWeek: number };

type TrainerForm = {
  name: string;
  email: string;
  bio: string;
  specialties: string;
  certifications: string;
  instagram: string;
  youtube: string;
  website: string;
};

const EMPTY_FORM: TrainerForm = {
  name: "", email: "", bio: "", specialties: "", certifications: "", instagram: "", youtube: "", website: "",
};

function TrainerDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: TrainerForm;
  onSave: (form: TrainerForm, id?: Id<"trainers">) => Promise<void>;
}) {
  const [form, setForm] = useState<TrainerForm>(initial);
  const [saving, setSaving] = useState(false);
  const editing = !!initial.name;
  const set = (k: keyof TrainerForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save trainer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit trainer" : "Add trainer"}</DialogTitle>
          <DialogDescription>
            Profile info shown on the customer site plus the specialties used for class assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-name">Full name *</Label>
              <Input id="t-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-email">Email</Label>
              <Input id="t-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-bio">Bio</Label>
            <Textarea id="t-bio" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-spec">Specialties (comma separated)</Label>
              <Input id="t-spec" value={form.specialties} onChange={(e) => set("specialties", e.target.value)} placeholder="Strength, HIIT" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-cert">Certifications (comma separated)</Label>
              <Input id="t-cert" value={form.certifications} onChange={(e) => set("certifications", e.target.value)} placeholder="CSCS, NASM-CPT" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-ig">Instagram</Label>
              <Input id="t-ig" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@handle" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-yt">YouTube</Label>
              <Input id="t-yt" value={form.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="@channel" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="t-web">Website</Label>
              <Input id="t-web" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="trainerwebsite.com" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add trainer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Trainers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainerRow | null>(null);
  const [deleting, setDeleting] = useState<TrainerRow | null>(null);

  const trainers = useQuery(api.trainers.list, { search: search || undefined });
  const create = useMutation(api.trainers.create);
  const update = useMutation(api.trainers.update);
  const toggleActive = useMutation(api.trainers.toggleActive);
  const remove = useMutation(api.trainers.remove);

  const handleSave = async (form: TrainerForm, id?: Id<"trainers">) => {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      bio: form.bio.trim() || undefined,
      specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
      certifications: form.certifications.split(",").map((s) => s.trim()).filter(Boolean),
      socials: {
        instagram: form.instagram.trim() || undefined,
        youtube: form.youtube.trim() || undefined,
        website: form.website.trim() || undefined,
      },
    };
    if (id) {
      await update({ id, ...payload });
      toast.success("Trainer updated");
    } else {
      await create(payload);
      toast.success("Trainer added");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await remove({ id: deleting._id });
    toast.success(`${deleting.name} removed`);
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainer Management"
        description="Coach profiles, certifications and weekly class load — the same profiles shown on the customer site."
        actions={
          <Button className="cursor-pointer gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" />
            Add trainer
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search by name, specialty or email…" className="w-full sm:max-w-xs" />

      {!trainers ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-52 w-full" />)}
        </div>
      ) : trainers.length === 0 ? (
        <Card className="border-dashed border-border/70 shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No trainers found. Add your first coach to start scheduling classes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {trainers.map((t) => (
            <Card key={t._id} className="border-border/70 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={t.name} className="size-11 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.email ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeleting(t)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {t.bio && <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-muted-foreground">{t.bio}</p>}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.specialties.slice(0, 4).map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>
                  ))}
                  {t.certifications.length > 0 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {t.certifications.length} certs
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium tabular-nums text-foreground">{t.classesThisWeek}</span> classes this week
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t.active ? "Active" : "Inactive"}</span>
                    <Switch
                      checked={t.active}
                      onCheckedChange={(v) => {
                        void toggleActive({ id: t._id, active: v });
                        toast.success(`${t.name} ${v ? "activated" : "deactivated"}`);
                      }}
                    />
                  </div>
                </div>
                {t.upcomingClasses > 0 && (
                  <div className="mt-2">
                    <StatusBadge status="upcoming" label={`${t.upcomingClasses} upcoming classes`} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TrainerDialog
        key={`${editing?._id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing ? {
          name: editing.name,
          email: editing.email ?? "",
          bio: editing.bio ?? "",
          specialties: editing.specialties.join(", "),
          certifications: editing.certifications.join(", "),
          instagram: editing.socials?.instagram ?? "",
          youtube: editing.socials?.youtube ?? "",
          website: editing.socials?.website ?? "",
        } : EMPTY_FORM}
        onSave={(form) => handleSave(form, editing?._id)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their upcoming classes will be unassigned. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={handleDelete}>
              Delete trainer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}