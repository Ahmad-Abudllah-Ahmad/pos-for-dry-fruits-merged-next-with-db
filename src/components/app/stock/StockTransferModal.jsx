"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createTransferBatch } from "@/api";
import { ApiError } from "@/api/client";
import { Button } from "@/components/common/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getItemName } from "@/lib/item-name";

function newTransferRow() {
  return { id: `${Date.now()}-${Math.random()}`, itemId: "", subledgerId: "", qtyKg: "1", quantity: "" };
}

/** @param {string | number} value */
function kgToGrams(value) {
  const kg = parseFloat(String(value));
  if (!Number.isFinite(kg) || kg <= 0) return null;
  const grams = Math.round(kg * 1000);
  return grams >= 1 ? grams : null;
}

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   workspaceId: number;
 *   items: Array<Record<string, unknown>>;
 *   subledgers: Array<Record<string, unknown>>;
 *   initialDirection: "warehouse_to_shop" | "shop_to_warehouse";
 *   onSuccess: () => void;
 * }} props
 */
export function StockTransferModal({
  open,
  onOpenChange,
  workspaceId,
  items,
  subledgers,
  initialDirection,
  onSuccess,
}) {
  const [transferDirection, setTransferDirection] = useState(initialDirection);
  const [transferRows, setTransferRows] = useState([newTransferRow()]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTransferDirection(initialDirection);
    setTransferRows([newTransferRow()]);
  }, [initialDirection, open]);

  async function handleTransfer() {
    const itemsPayload = [];
    for (const row of transferRows) {
      const itemId = Number(row.itemId);
      const subledgerId = row.subledgerId ? Number(row.subledgerId) : null;
      const grams = kgToGrams(row.qtyKg);
      const rawQuantity = String(row.quantity ?? "").trim();
      const quantity = rawQuantity ? parseInt(rawQuantity, 10) : 0;
      if (!itemId || grams == null) {
        toast.error("Choose item and quantity (kg) for every transfer line");
        return;
      }
      if (!Number.isFinite(quantity) || quantity < 0) {
        toast.error("Enter a valid cotton/bags count or leave it empty");
        return;
      }
      itemsPayload.push({
        item_id: itemId,
        subledger_id: subledgerId,
        quantity,
        quantity_grams: grams,
      });
    }

    if (itemsPayload.length === 0) {
      toast.error("Add at least one transfer line");
      return;
    }

    setBusy(true);
    try {
      await createTransferBatch(workspaceId, { direction: transferDirection, items: itemsPayload });
      toast.success(
        transferDirection === "warehouse_to_shop"
          ? "Transfer warehouse to shop recorded"
          : "Transfer shop to warehouse recorded"
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Stock Transfer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Direction</Label>
            <Select value={transferDirection} onValueChange={setTransferDirection}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warehouse_to_shop">Warehouse to shop</SelectItem>
                <SelectItem value="shop_to_warehouse">Shop to warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {transferRows.map((row, index) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-2xl border border-border/80 bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_160px_auto] md:items-end"
              >
                <div className="space-y-2">
                  <Label>Main product</Label>
                  <Select
                    value={row.itemId}
                    onValueChange={(value) =>
                      setTransferRows((rows) =>
                        rows.map((entry) => (entry.id === row.id ? { ...entry, itemId: value, subledgerId: "" } : entry))
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose product" />
                    </SelectTrigger>
                    <SelectContent>
                      {items
                        .filter((item) => item.is_active !== false)
                        .map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {getItemName(/** @type {Record<string, string>} */ (item.name))}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Item variants</Label>
                  <Select
                    value={row.subledgerId || "standalone"}
                    onValueChange={(value) =>
                      setTransferRows((rows) =>
                        rows.map((entry) =>
                          entry.id === row.id ? { ...entry, subledgerId: value === "standalone" ? "" : value } : entry
                        )
                      )
                    }
                    disabled={!row.itemId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Standalone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standalone">Standalone</SelectItem>
                      {subledgers
                        .filter(
                          (subledger) =>
                            Number(subledger.item_id) === Number(row.itemId) && subledger.is_active !== false
                        )
                        .map((subledger) => (
                          <SelectItem key={subledger.id} value={String(subledger.id)}>
                            {getItemName(/** @type {Record<string, string>} */ (subledger.name))}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Qty (kg)</Label>
                  <Input
                    value={row.qtyKg}
                    onChange={(e) =>
                      setTransferRows((rows) =>
                        rows.map((entry) => (entry.id === row.id ? { ...entry, qtyKg: e.target.value } : entry))
                      )
                    }
                    type="number"
                    min="0.001"
                    step="0.001"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cotton/Bags</Label>
                  <Input
                    value={row.quantity}
                    onChange={(e) =>
                      setTransferRows((rows) =>
                        rows.map((entry) => (entry.id === row.id ? { ...entry, quantity: e.target.value } : entry))
                      )
                    }
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Optional"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setTransferRows((rows) => (rows.length > 1 ? rows.filter((entry) => entry.id !== row.id) : rows))
                  }
                  disabled={busy || transferRows.length === 1}
                  aria-label={`Remove transfer line ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setTransferRows((rows) => [...rows, newTransferRow()])} disabled={busy}>
              <Plus className="size-4" />
              Add line
            </Button>
            <Button type="button" onClick={handleTransfer} disabled={busy}>
              <ArrowRightLeft className="size-4" />
              {busy ? "Saving..." : "Save transfer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
