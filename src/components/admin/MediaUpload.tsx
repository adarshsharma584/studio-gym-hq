import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export type MediaValue = { url: string; storageId?: Id<"_storage"> };

/**
 * Drag-and-drop media uploader for banners / reels / posts.
 * Uploads straight to Convex file storage (unlimited size) and reports the
 * resulting URL + storage id up via onChange. The caller persists the storage
 * id so the file can be deleted later, and passes `removeStorageId` to the
 * save mutation when replacing an existing file.
 */
export function MediaUpload({
  label,
  accept,
  hint,
  value,
  onChange,
  className,
}: {
  label: string;
  accept: string; // e.g. "image/*" | "video/*"
  hint?: string;
  value?: MediaValue | null;
  onChange: (v: MediaValue | null) => void;
  className?: string;
}) {
  const generateUploadUrl = useMutation(api.content.generateUploadUrl);
  const resolveUploadUrl = useMutation(api.content.resolveUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isVideo = accept.startsWith("video");
  const kind = accept.split("/")[0];

  const uploadFile = async (file: File) => {
    if (file.type && !file.type.startsWith(kind)) {
      toast.error(`${label} must be a ${kind} file`);
      return;
    }
    setUploading(true);
    try {
      // Step 1 — short-lived upload URL (staff-gated server side)
      const postUrl = await generateUploadUrl();
      // Step 2 — POST the file directly to Convex storage
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      // Step 3 — resolve the public URL for preview + storage
      const url = await resolveUploadUrl({ storageId });
      if (!url) throw new Error("Uploaded file could not be resolved");
      onChange({ url, storageId });
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed — please try again");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-sm font-medium">{label}</p>

      {value?.url ? (
        <div className="overflow-hidden rounded-lg border border-border/80">
          <div className="relative aspect-video w-full bg-muted">
            {isVideo ? (
              <video src={value.url} controls playsInline className="h-full w-full object-contain" />
            ) : (
              <img src={value.url} alt="" className="h-full w-full object-cover" />
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-border/80 bg-muted/40 px-3 py-2">
            <Button type="button" variant="ghost" size="sm" className="cursor-pointer gap-1.5" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <RefreshCw className="size-3.5" /> Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" className="cursor-pointer gap-1.5 text-destructive hover:text-destructive" onClick={() => onChange(null)} disabled={uploading}>
              <Trash2 className="size-3.5" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void uploadFile(file);
          }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-7 text-center transition-colors",
            "hover:border-primary/50 hover:bg-primary/5",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isVideo ? <UploadCloud className="size-4" /> : <ImageIcon className="size-4" />}
            </span>
          )}
          <span className="text-xs font-medium text-foreground">
            {uploading ? "Uploading…" : isVideo ? "Drop a video or click to browse" : "Drop an image or click to browse"}
          </span>
          {hint && <span className="max-w-xs text-[11px] leading-4 text-muted-foreground">{hint}</span>}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />
    </div>
  );
}