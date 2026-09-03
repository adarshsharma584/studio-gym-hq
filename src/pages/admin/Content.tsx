import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { PageHeader, StatusBadge, formatDate, formatDateTime, relativeDays } from "@/components/admin/ui";
import { CalendarClock, Eye, Image as ImageIcon, Pencil, Play, Plus, Trash2, Video } from "lucide-react";
import { MediaUpload, type MediaValue } from "@/components/admin/MediaUpload";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type BannerRow = Doc<"banners"> & { isActive: boolean };
type ReelRow = Doc<"reels">;
type AnnouncementRow = Doc<"announcements"> & { isActive: boolean };
type PostRow = Doc<"posts">;

const toDateInput = (ts?: number) => (ts ? new Date(ts).toISOString().slice(0, 10) : "");
const fromDateInput = (v: string) => (v ? new Date(`${v}T00:00:00`).getTime() : NaN);
const toLocalInput = (ts?: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function BannerDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: BannerRow | null;
  onSave: (b: { title: string; image?: string; storageId?: Id<"_storage">; removeStorageId?: Id<"_storage">; ctaLabel?: string; ctaLink?: string; startDate: number; endDate: number; position: number; active: boolean }, id?: Id<"banners">) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? "");
  const [ctaLink, setCtaLink] = useState(initial?.ctaLink ?? "");
  const [start, setStart] = useState(toDateInput(initial?.startDate));
  const [end, setEnd] = useState(toDateInput(initial?.endDate));
  const [position, setPosition] = useState(initial ? String(initial.position) : "0");
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<MediaValue | null>(() =>
    initial?.image ? { url: initial.image, storageId: initial.storageId } : null,
  );
  const discardUpload = useMutation(api.content.discardUpload);
  const pendingStorage = useRef<Id<"_storage"> | null>(null);

  /** Drop any file that was uploaded but never saved (dialog closed). */
  const discardPending = () => {
    if (pendingStorage.current) {
      void discardUpload({ storageId: pendingStorage.current }).catch(() => {});
      pendingStorage.current = null;
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) discardPending();
    onOpenChange(v);
  };

  const handleMediaChange = (v: MediaValue | null) => {
    if (v?.storageId) pendingStorage.current = v.storageId;
    setMedia(v);
  };

  const submit = async () => {
    const startTs = fromDateInput(start);
    const endTs = fromDateInput(end);
    if (!title.trim() || !startTs || !endTs || endTs <= startTs) {
      toast.error("Banner needs a title and a valid start → end window");
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          image: media?.url,
          storageId: media?.storageId,
          removeStorageId: initial?.storageId,
          ctaLabel: ctaLabel.trim() || undefined,
          ctaLink: ctaLink.trim() || undefined,
          startDate: startTs,
          endDate: endTs,
          position: Number(position) || 0,
          active,
        },
        initial?._id,
      );
      if (!media && pendingStorage.current) discardPending();
      pendingStorage.current = null;
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit banner" : "New banner"}</DialogTitle>
          <DialogDescription>
            Scheduled banners appear on the customer homepage automatically between the start and end dates.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <MediaUpload
            label="Banner image"
            accept="image/*"
            hint="Wide, high-resolution image recommended (16:9). Shown as the hero background on the customer homepage."
            value={media}
            onChange={handleMediaChange}
          />
          <div className="space-y-1.5">
            <Label htmlFor="b-title">Headline *</Label>
            <Input id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monsoon Challenge — 30% off" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="b-cta">CTA label</Label>
              <Input id="b-cta" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Claim offer" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-link">CTA link</Label>
              <Input id="b-link" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/join" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-start">Start date *</Label>
              <Input id="b-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-end">End date *</Label>
              <Input id="b-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-pos">Position</Label>
              <Input id="b-pos" type="number" min={0} value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Enabled</p>
              <p className="text-xs text-muted-foreground">Schedule is still enforced regardless of this switch</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : initial ? "Save changes" : "Create banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReelDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ReelRow | null;
  onSave: (r: { title: string; videoUrl?: string; storageId?: Id<"_storage">; removeStorageId?: Id<"_storage">; cover?: string; coverStorageId?: Id<"_storage">; removeCoverStorageId?: Id<"_storage">; durationSec?: number; visible: boolean; order: number }, id?: Id<"reels">) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [duration, setDuration] = useState(initial?.durationSec ? String(initial.durationSec) : "");
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [saving, setSaving] = useState(false);
  const [video, setVideo] = useState<MediaValue | null>(() =>
    initial?.videoUrl ? { url: initial.videoUrl, storageId: initial.storageId } : null,
  );
  const [cover, setCover] = useState<MediaValue | null>(() =>
    initial?.cover ? { url: initial.cover, storageId: initial.coverStorageId } : null,
  );
  const discardUpload = useMutation(api.content.discardUpload);
  const pendingStorage = useRef<Set<Id<"_storage">>>(new Set());

  /** Drop any files that were uploaded but never saved (dialog closed). */
  const discardPending = () => {
    for (const sid of pendingStorage.current) {
      void discardUpload({ storageId: sid }).catch(() => {});
    }
    pendingStorage.current.clear();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) discardPending();
    onOpenChange(v);
  };

  const handleVideoChange = (v: MediaValue | null) => {
    if (v?.storageId) pendingStorage.current.add(v.storageId);
    setVideo(v);
  };

  const handleCoverChange = (v: MediaValue | null) => {
    if (v?.storageId) pendingStorage.current.add(v.storageId);
    setCover(v);
  };

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          videoUrl: video?.url,
          storageId: video?.storageId,
          removeStorageId: initial?.storageId,
          cover: cover?.url,
          coverStorageId: cover?.storageId,
          removeCoverStorageId: initial?.coverStorageId,
          durationSec: duration ? Number(duration) : undefined,
          visible,
          order: initial?.order ?? 0,
        },
        initial?._id,
      );
      pendingStorage.current.clear();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save reel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit reel" : "Add reel"}</DialogTitle>
          <DialogDescription>Short clips shown in the Instagram-style Reels strip on the customer app.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <MediaUpload
            label="Reel video"
            accept="video/*"
            hint="Short vertical clip (9:16 works best). Plays in the Reels strip on the customer site."
            value={video}
            onChange={handleVideoChange}
          />
          <MediaUpload
            label="Cover image (optional)"
            accept="image/*"
            hint="Poster shown on the card before the video plays."
            value={cover}
            onChange={handleCoverChange}
          />
          <div className="space-y-1.5">
            <Label htmlFor="r-title">Title *</Label>
            <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 60-second legs day finisher" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="r-dur">Duration (seconds)</Label>
              <Input id="r-dur" type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Visible</p>
                <p className="text-xs text-muted-foreground">Shown to members</p>
              </div>
              <Switch checked={visible} onCheckedChange={setVisible} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add reel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: AnnouncementRow | null;
  onSave: (a: { title: string; body: string; audience: string; priority: string; startsAt: number; endsAt?: number; active: boolean }, id?: Id<"announcements">) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [audience, setAudience] = useState<string>(initial?.audience ?? "all");
  const [priority, setPriority] = useState<string>(initial?.priority ?? "normal");
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt));
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const startTs = startsAt ? new Date(startsAt).getTime() : NaN;
    if (!title.trim() || !body.trim() || !startTs) return;
    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          body: body.trim(),
          audience,
          priority,
          startsAt: startTs,
          endsAt: endsAt ? new Date(endsAt).getTime() : undefined,
          active,
        },
        initial?._id,
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit announcement" : "New announcement"}</DialogTitle>
          <DialogDescription>Alert-style messages that pop up on the customer dashboard during their window.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="a-title">Title *</Label>
            <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holiday schedule" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-body">Message *</Label>
            <Textarea id="a-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-start">Starts *</Label>
              <Input id="a-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-end">Ends (optional)</Label>
              <Input id="a-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !title.trim() || !body.trim()}>
            {saving ? "Saving…" : initial ? "Save changes" : "Publish announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PostDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: PostRow | null;
  onSave: (p: { title: string; type: string; image?: string; storageId?: Id<"_storage">; removeStorageId?: Id<"_storage">; excerpt?: string; body?: string; published: boolean }, id?: Id<"posts">) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "blog");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<MediaValue | null>(() =>
    initial?.image ? { url: initial.image, storageId: initial.storageId } : null,
  );
  const discardUpload = useMutation(api.content.discardUpload);
  const pendingStorage = useRef<Id<"_storage"> | null>(null);

  /** Drop any file that was uploaded but never saved (dialog closed). */
  const discardPending = () => {
    if (pendingStorage.current) {
      void discardUpload({ storageId: pendingStorage.current }).catch(() => {});
      pendingStorage.current = null;
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) discardPending();
    onOpenChange(v);
  };

  const handleMediaChange = (v: MediaValue | null) => {
    if (v?.storageId) pendingStorage.current = v.storageId;
    setMedia(v);
  };

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          type,
          image: media?.url,
          storageId: media?.storageId,
          removeStorageId: initial?.storageId,
          excerpt: excerpt.trim() || undefined,
          body: body.trim() || undefined,
          published,
        },
        initial?._id,
      );
      if (!media && pendingStorage.current) discardPending();
      pendingStorage.current = null;
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit post" : "New post"}</DialogTitle>
          <DialogDescription>Blog articles and gallery entries pushed to the customer site.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <MediaUpload
            label={type === "gallery" ? "Gallery image" : "Cover image"}
            accept="image/*"
            hint={type === "gallery" ? "Shown in the gallery grid on the customer homepage." : "Shown as the card cover on the blog page."}
            value={media}
            onChange={handleMediaChange}
          />
          <div className="space-y-1.5">
            <Label htmlFor="po-title">Title *</Label>
            <Input id="po-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="gallery">Gallery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">Visible on the customer site</p>
              </div>
              <Switch checked={published} onCheckedChange={setPublished} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="po-excerpt">Excerpt</Label>
            <Input id="po-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="po-body">Body</Label>
            <Textarea id="po-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : initial ? "Save changes" : "Save post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Content() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "banners";
  const setTab = (t: string) => setSearchParams(t === "banners" ? {} : { tab: t });

  const data = useQuery(api.content.getAll);

  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<BannerRow | null>(null);
  const [reelDialogOpen, setReelDialogOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<ReelRow | null>(null);
  const [deletingReel, setDeletingReel] = useState<ReelRow | null>(null);
  const [annDialogOpen, setAnnDialogOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<AnnouncementRow | null>(null);
  const [deletingAnn, setDeletingAnn] = useState<AnnouncementRow | null>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostRow | null>(null);
  const [deletingPost, setDeletingPost] = useState<PostRow | null>(null);

  const saveBanner = useMutation(api.content.saveBanner);
  const removeBanner = useMutation(api.content.removeBanner);
  const saveReel = useMutation(api.content.saveReel);
  const removeReel = useMutation(api.content.removeReel);
  const saveAnnouncement = useMutation(api.content.saveAnnouncement);
  const removeAnnouncement = useMutation(api.content.removeAnnouncement);
  const savePost = useMutation(api.content.savePost);
  const removePost = useMutation(api.content.removePost);

  const now = Date.now();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Management"
        description="Everything here is pushed straight to the customer website and member app."
        actions={
          tab === "banners" ? (
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditingBanner(null); setBannerDialogOpen(true); }}>
              <Plus className="size-4" /> New banner
            </Button>
          ) : tab === "reels" ? (
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditingReel(null); setReelDialogOpen(true); }}>
              <Plus className="size-4" /> Add reel
            </Button>
          ) : tab === "announcements" ? (
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditingAnn(null); setAnnDialogOpen(true); }}>
              <Plus className="size-4" /> New announcement
            </Button>
          ) : (
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditingPost(null); setPostDialogOpen(true); }}>
              <Plus className="size-4" /> New post
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="reels">Reels / Videos</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="posts">Blog / Gallery</TabsTrigger>
        </TabsList>

        {/* Banners */}
        <TabsContent value="banners" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardContent className="p-0">
              {!data ? (
                <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : data.banners.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No banners yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Banner</TableHead>
                      <TableHead className="hidden sm:table-cell">CTA</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead className="hidden md:table-cell">Position</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.banners.map((b) => (
                      <TableRow key={b._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {b.image ? (
                              <img src={b.image} alt="" className="size-14 shrink-0 rounded-lg border border-border/60 object-cover" />
                            ) : (
                              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ImageIcon className="size-5" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">{b.title}</span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <StatusBadge status={b.isActive ? "live" : b.endDate > now ? "scheduled" : "expired"} label={b.isActive ? "Live now" : b.endDate > now ? "Scheduled" : "Expired"} />
                                {!b.active && <Badge variant="outline" className="text-muted-foreground">disabled</Badge>}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {b.ctaLabel ? (
                            <span className="text-sm text-muted-foreground">{b.ctaLabel} <span className="text-xs">→ {b.ctaLink}</span></span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {formatDate(b.startDate)} → {formatDate(b.endDate)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {b.isActive ? "showing now" : b.endDate > now ? relativeDays(b.startDate) : `ended ${relativeDays(b.endDate)}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{b.position}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditingBanner(b); setBannerDialogOpen(true); }}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeletingBanner(b)}>
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

        {/* Reels */}
        <TabsContent value="reels" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardContent className="p-0">
              {!data ? (
                <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : data.reels.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No reels yet.</p>
              ) : (
                <div className="divide-y">
                  {data.reels.map((r) => (
                    <div key={r._id} className="flex items-center gap-4 px-6 py-3.5">
                      {r.cover ? (
                        <img src={r.cover} alt="" className="size-14 shrink-0 rounded-lg border border-border/60 object-cover" />
                      ) : r.videoUrl ? (
                        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-zinc-950">
                          <video src={r.videoUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                          <span className="absolute flex size-5 items-center justify-center rounded-full bg-black/60">
                            <Play className="size-3 text-white" />
                          </span>
                        </div>
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Video className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.durationSec ? `${Math.floor(r.durationSec / 60)}:${String(r.durationSec % 60).padStart(2, "0")}` : "—"} · order {r.order}
                        </p>
                      </div>
                      <StatusBadge status={r.visible ? "visible" : "draft"} label={r.visible ? "Visible" : "Hidden"} />
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditingReel(r); setReelDialogOpen(true); }}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeletingReel(r)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements" className="mt-4">
          <div className="space-y-3">
            {!data ? (
              <Card className="border-border/70 shadow-none"><CardContent className="p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="mb-3 h-16 w-full" />)}</CardContent></Card>
            ) : data.announcements.length === 0 ? (
              <Card className="border-dashed border-border/70 shadow-none"><CardContent className="py-12 text-center text-sm text-muted-foreground">No announcements.</CardContent></Card>
            ) : (
              data.announcements.map((a) => (
                <Card key={a._id} className="border-border/70 shadow-none">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{a.title}</p>
                          <StatusBadge status={a.priority} />
                          <Badge variant="secondary" className="font-normal capitalize">{a.audience}</Badge>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{a.body}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarClock className="size-3.5" />
                          {formatDateTime(a.startsAt)} → {a.endsAt ? formatDateTime(a.endsAt) : "until further notice"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={a.isActive ? "live" : "expired"} label={a.isActive ? "Active" : "Ended"} />
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditingAnn(a); setAnnDialogOpen(true); }}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeletingAnn(a)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Posts */}
        <TabsContent value="posts" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardContent className="p-0">
              {!data ? (
                <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : data.posts.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No posts yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Published</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.posts.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt="" className="size-14 shrink-0 rounded-lg border border-border/60 object-cover" />
                            ) : (
                              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                {p.type === "gallery" ? <ImageIcon className="size-5" /> : <Eye className="size-5" />}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{p.title}</p>
                              {p.excerpt && <p className="max-w-md truncate text-xs text-muted-foreground">{p.excerpt}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="font-normal capitalize">{p.type}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</TableCell>
                        <TableCell><StatusBadge status={p.published ? "published" : "draft"} /></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer" title="Edit" onClick={() => { setEditingPost(p); setPostDialogOpen(true); }}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-destructive" title="Delete" onClick={() => setDeletingPost(p)}>
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

      <BannerDialog
        key={`${editingBanner?._id ?? "new"}-${bannerDialogOpen}`}
        open={bannerDialogOpen}
        onOpenChange={setBannerDialogOpen}
        initial={editingBanner}
        onSave={async (b, id) => {
          await saveBanner({ ...b, id });
          toast.success(id ? "Banner updated" : "Banner created");
        }}
      />
      <ReelDialog
        key={`${editingReel?._id ?? "new"}-${reelDialogOpen}`}
        open={reelDialogOpen}
        onOpenChange={setReelDialogOpen}
        initial={editingReel}
        onSave={async (r, id) => {
          await saveReel({ ...r, id });
          toast.success(id ? "Reel updated" : "Reel added");
        }}
      />
      <AnnouncementDialog
        key={`${editingAnn?._id ?? "new"}-${annDialogOpen}`}
        open={annDialogOpen}
        onOpenChange={setAnnDialogOpen}
        initial={editingAnn}
        onSave={async (a, id) => {
          await saveAnnouncement({ ...a, id });
          toast.success(id ? "Announcement updated" : "Announcement published");
        }}
      />
      <PostDialog
        key={`${editingPost?._id ?? "new"}-${postDialogOpen}`}
        open={postDialogOpen}
        onOpenChange={setPostDialogOpen}
        initial={editingPost}
        onSave={async (p, id) => {
          await savePost({ ...p, id });
          toast.success(id ? "Post updated" : "Post created");
        }}
      />

      <AlertDialog open={!!deletingBanner} onOpenChange={(v) => !v && setDeletingBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription>"{deletingBanner?.title}" will stop showing on the customer site immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await removeBanner({ id: deletingBanner!._id, storageId: deletingBanner!.storageId });
              toast.success("Banner deleted");
              setDeletingBanner(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingReel} onOpenChange={(v) => !v && setDeletingReel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reel?</AlertDialogTitle>
            <AlertDialogDescription>"{deletingReel?.title}" will be removed from the customer Reels strip.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await removeReel({ id: deletingReel!._id, storageId: deletingReel!.storageId, coverStorageId: deletingReel!.coverStorageId });
              toast.success("Reel deleted");
              setDeletingReel(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingAnn} onOpenChange={(v) => !v && setDeletingAnn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>"{deletingAnn?.title}" will stop appearing on member dashboards.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await removeAnnouncement({ id: deletingAnn!._id });
              toast.success("Announcement deleted");
              setDeletingAnn(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingPost} onOpenChange={(v) => !v && setDeletingPost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>"{deletingPost?.title}" will be removed from the site.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await removePost({ id: deletingPost!._id, storageId: deletingPost!.storageId });
              toast.success("Post deleted");
              setDeletingPost(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}