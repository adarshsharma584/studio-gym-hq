import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatusBadge, formatDateTime } from "@/components/admin/ui";
import { Mail, Pencil, Plus, Send, Smartphone, Trash2, Users, Bell as BellIcon } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type NotificationRow = Doc<"notifications">;

const SEGMENTS: Array<{ value: string; label: string; description: string }> = [
  { value: "all", label: "All members", description: "Everyone with a member profile" },
  { value: "inactive30", label: "Inactive 30+ days", description: "Members who haven't visited in 30 days" },
  { value: "expiring", label: "Expiring in 14 days", description: "Active plans ending within 14 days" },
  { value: "newMembers", label: "New members (30d)", description: "Joined in the last 30 days" },
  { value: "noPlan", label: "No active plan", description: "Members without an active subscription" },
];

const CHANNELS = [
  { value: "push", label: "Push", icon: BellIcon },
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: Smartphone },
];

function toLocalInput(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CampaignDialog({
  open,
  onOpenChange,
  initial,
  counts,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: NotificationRow | null;
  counts: Record<string, number> | undefined;
  onSave: (c: {
    title: string;
    body: string;
    channels: string[];
    audienceSegment: string;
    status: string;
    sendAt?: number;
  }, id?: Id<"notifications">) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [channels, setChannels] = useState<string[]>(initial?.channels ?? ["push"]);
  const [segment, setSegment] = useState<string>(initial?.audienceSegment ?? "all");
  const [status, setStatus] = useState<string>(initial?.status ?? "draft");
  const [sendAt, setSendAt] = useState(toLocalInput(initial?.sendAt));
  const [saving, setSaving] = useState(false);

  const toggleChannel = (v: string) =>
    setChannels((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));

  const submit = async () => {
    if (!title.trim() || !body.trim() || channels.length === 0) return;
    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          body: body.trim(),
          channels,
          audienceSegment: segment,
          status,
          sendAt: status === "scheduled" && sendAt ? new Date(sendAt).getTime() : undefined,
        },
        initial?._id,
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  const count = counts?.[segment];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit campaign" : "New campaign"}</DialogTitle>
          <DialogDescription>Target a member segment across push, email and SMS channels.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="n-title">Title *</Label>
            <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Renewal reminder" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-body">Message *</Label>
            <Textarea id="n-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <label
                  key={c.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    channels.includes(c.value) ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <Checkbox
                    checked={channels.includes(c.value)}
                    onCheckedChange={() => toggleChannel(c.value)}
                  />
                  <c.icon className="size-3.5 text-muted-foreground" />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Audience segment</Label>
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label} ({counts?.[s.value] ?? "…"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {SEGMENTS.find((s) => s.value === segment)?.description} · will reach{" "}
              <span className="font-medium tabular-nums text-foreground">{count ?? "…"}</span> members
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Delivery</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Save as draft</SelectItem>
                  <SelectItem value="scheduled">Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === "scheduled" && (
              <div className="space-y-1.5">
                <Label htmlFor="n-send">Send at</Label>
                <Input id="n-send" type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !title.trim() || !body.trim() || channels.length === 0}>
            {saving ? "Saving…" : initial ? "Save changes" : status === "scheduled" ? "Schedule campaign" : "Save draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Notifications() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationRow | null>(null);
  const [deleting, setDeleting] = useState<NotificationRow | null>(null);
  const [sending, setSending] = useState<NotificationRow | null>(null);

  const notifications = useQuery(api.notifications.list);
  const counts = useQuery(api.notifications.segmentCounts);
  const create = useMutation(api.notifications.create);
  const update = useMutation(api.notifications.update);
  const send = useMutation(api.notifications.send);
  const remove = useMutation(api.notifications.remove);

  const handleSave = async (c: { title: string; body: string; channels: string[]; audienceSegment: string; status: string; sendAt?: number }, id?: Id<"notifications">) => {
    if (id) {
      await update({ id, ...c });
      toast.success("Campaign updated");
    } else {
      await create(c);
      toast.success(c.status === "scheduled" ? "Campaign scheduled" : "Draft saved");
    }
  };

  const handleSend = async (n: NotificationRow) => {
    setSending(n);
    try {
      const count = await send({ id: n._id });
      toast.success(`Campaign sent to ${count} members`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Draft and send targeted push, email and SMS campaigns to specific member segments."
        actions={
          <Button className="cursor-pointer gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" /> New campaign
          </Button>
        }
      />

      {!notifications ? (
        <Card className="border-border/70 shadow-none"><CardContent className="p-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="mb-3 h-20 w-full" />)}</CardContent></Card>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed border-border/70 shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No campaigns yet — create one to reach your members.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const seg = SEGMENTS.find((s) => s.value === n.audienceSegment);
            return (
              <Card key={n._id} className="border-border/70 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <StatusBadge status={n.status} />
                        {n.status === "scheduled" && n.sendAt && (
                          <Badge variant="outline" className="text-muted-foreground">
                            {formatDateTime(n.sendAt)}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{n.body}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <Users className="size-3" /> {seg?.label ?? n.audienceSegment}
                        </Badge>
                        {n.channels.map((ch) => (
                          <Badge key={ch} variant="outline" className="gap-1 font-normal capitalize text-muted-foreground">
                            {ch === "push" ? <BellIcon className="size-3" /> : ch === "email" ? <Mail className="size-3" /> : <Smartphone className="size-3" />}
                            {ch}
                          </Badge>
                        ))}
                        {n.recipientCount !== undefined && (
                          <span className="text-xs tabular-nums text-muted-foreground">
                            delivered to {n.recipientCount} members
                            {n.sentAt ? ` · ${formatDateTime(n.sentAt)}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {n.status !== "sent" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 cursor-pointer gap-1 text-xs"
                          disabled={!!sending}
                          onClick={() => handleSend(n)}
                        >
                          <Send className="size-3.5" /> Send now
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditing(n); setDialogOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeleting(n)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CampaignDialog
        key={`${editing?._id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        counts={counts}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.title}" will be removed. Sent campaigns keep their delivery record only in this list.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await remove({ id: deleting!._id });
              toast.success("Campaign deleted");
              setDeleting(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}