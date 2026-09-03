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
import { Switch } from "@/components/ui/switch";
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
import { ExportButton, PageHeader, SearchInput, StatCard, StatusBadge, money } from "@/components/admin/ui";
import { AlertTriangle, Minus, Package, PackageX, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type InventoryRow = Doc<"inventory"> & { lowStock: boolean };

const CATEGORIES = ["supplements", "merch", "retail", "consumables"] as const;

function InventoryDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: InventoryRow | null;
  onSave: (i: {
    name: string;
    category: string;
    sku: string;
    stock: number;
    reorderLevel: number;
    unit: string;
    price: number;
    location?: string;
  }, id?: Id<"inventory">) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "supplements");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "0");
  const [reorderLevel, setReorderLevel] = useState(initial ? String(initial.reorderLevel) : "5");
  const [unit, setUnit] = useState(initial?.unit ?? "units");
  const [price, setPrice] = useState(initial ? String(initial.price) : "0");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !sku.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          sku: sku.trim().toUpperCase(),
          stock: Math.max(0, Number(stock) || 0),
          reorderLevel: Math.max(0, Number(reorderLevel) || 0),
          unit: unit.trim() || "units",
          price: Math.max(0, Number(price) || 0),
          location: location.trim() || undefined,
        },
        initial?._id,
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit item" : "Add inventory item"}</DialogTitle>
          <DialogDescription>Retail, supplements and consumables sold at the front counter.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="i-name">Name *</Label>
            <Input id="i-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Whey Protein 2kg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-sku">SKU *</Label>
              <Input id="i-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SUP-001" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-stock">Stock</Label>
              <Input id="i-stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-reorder">Reorder at</Label>
              <Input id="i-reorder" type="number" min={0} value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-unit">Unit</Label>
              <Input id="i-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-price">Selling price (₹)</Label>
              <Input id="i-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i-loc">Location</Label>
            <Input id="i-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Store room A" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving || !name.trim() || !sku.trim()}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustDialog({
  item,
  direction,
  onClose,
}: {
  item: InventoryRow;
  direction: "in" | "out";
  onClose: () => void;
}) {
  const adjustStock = useMutation(api.equipment.adjustStock);
  const [qty, setQty] = useState("10");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const n = Math.max(0, Number(qty) || 0);
    if (!n) return;
    setSaving(true);
    try {
      const newStock = await adjustStock({ id: item._id, delta: direction === "in" ? n : -n });
      toast.success(`${item.name} → ${newStock} ${item.unit}`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{direction === "in" ? "Restock" : "Remove stock"} — {item.name}</DialogTitle>
          <DialogDescription>
            Current stock: {item.stock} {item.unit}. Reorder level: {item.reorderLevel}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="adj-qty">Quantity ({item.unit})</Label>
          <Input id="adj-qty" type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={onClose}>Cancel</Button>
          <Button className="cursor-pointer" onClick={submit} disabled={saving}>
            {saving ? "Updating…" : direction === "in" ? "Add stock" : "Remove stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [deleting, setDeleting] = useState<InventoryRow | null>(null);
  const [adjusting, setAdjusting] = useState<{ item: InventoryRow; direction: "in" | "out" } | null>(null);

  const inventory = useQuery(api.equipment.listInventory, { search: search || undefined, lowStockOnly: lowOnly || undefined });
  const stats = useQuery(api.equipment.inventoryStats);
  const create = useMutation(api.equipment.createInventory);
  const update = useMutation(api.equipment.updateInventory);
  const remove = useMutation(api.equipment.removeInventory);

  const handleSave = async (i: { name: string; category: string; sku: string; stock: number; reorderLevel: number; unit: string; price: number; location?: string }, id?: Id<"inventory">) => {
    if (id) {
      await update({ id, ...i });
      toast.success("Item updated");
    } else {
      await create(i);
      toast.success("Item added");
    }
  };

  const items = inventory ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Stock"
        description="Front-counter retail and consumables with automatic low-stock alerts at reorder level."
        actions={
          <>
            <ExportButton
              rows={items.map((i) => ({
                Name: i.name,
                SKU: i.sku,
                Category: i.category,
                Stock: i.stock,
                "Reorder level": i.reorderLevel,
                Unit: i.unit,
                Price: i.price,
                Location: i.location ?? "",
                "Low stock": i.lowStock ? "Yes" : "No",
              }))}
              filename="inventory.csv"
            />
            <Button className="cursor-pointer gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="size-4" /> Add item
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total items" value={stats?.totalItems ?? "…"} icon={Package} />
        <StatCard label="Low stock" value={stats?.lowStock ?? "…"} icon={AlertTriangle} tone={(stats?.lowStock ?? 0) > 0 ? "warning" : "default"} sub="at or below reorder level" />
        <StatCard label="Out of stock" value={stats?.outOfStock ?? "…"} icon={PackageX} tone={(stats?.outOfStock ?? 0) > 0 ? "danger" : "default"} />
        <StatCard label="Stock value" value={stats ? money(stats.stockValue) : "…"} icon={Wallet} tone="brand" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or SKU…" className="w-full sm:max-w-xs" />
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <Switch checked={lowOnly} onCheckedChange={setLowOnly} />
          <span className="text-sm">Low stock only</span>
        </div>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardContent className="p-0">
          {!inventory ? (
            <div className="space-y-3 p-6">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No items match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
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
                        <span className="text-xs text-muted-foreground capitalize">{i.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">{i.sku}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{i.location ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-semibold tabular-nums ${i.lowStock ? "text-red-500" : ""}`}>
                        {i.stock} <span className="font-normal text-xs text-muted-foreground">{i.unit}</span>
                      </span>
                      {i.lowStock && (
                        <span className="ml-2 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                          reorder at {i.reorderLevel}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm tabular-nums text-muted-foreground md:table-cell">{money(i.price)}</TableCell>
                    <TableCell>
                      <StatusBadge status={i.stock === 0 ? "critical" : i.lowStock ? "warning" : "operational"} label={i.stock === 0 ? "Out" : i.lowStock ? "Low" : "In stock"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" className="h-8 cursor-pointer gap-1 text-xs" onClick={() => setAdjusting({ item: i, direction: "in" })}>
                          <Plus className="size-3.5" /> Stock in
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 cursor-pointer gap-1 text-xs" onClick={() => setAdjusting({ item: i, direction: "out" })}>
                          <Minus className="size-3.5" /> Sold
                        </Button>
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

      <InventoryDialog
        key={`${editing?._id ?? "new"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />

      {adjusting && (
        <AdjustDialog
          key={adjusting.item._id}
          item={adjusting.item}
          direction={adjusting.direction}
          onClose={() => setAdjusting(null)}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the item from inventory. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer bg-destructive text-white hover:bg-destructive/90" onClick={async () => {
              await remove({ id: deleting!._id });
              toast.success("Item removed");
              setDeleting(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}