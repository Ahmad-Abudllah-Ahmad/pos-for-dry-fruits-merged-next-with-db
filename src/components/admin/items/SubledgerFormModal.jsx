"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createSubledger, updateSubledger } from "@/api";
import { ApiError } from "@/api/client";
import { Button } from "@/components/common/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getItemName } from "@/lib/item-name";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   workspaceId: number;
 *   items: Array<Record<string, unknown>>;
 *   subledger?: Record<string, unknown> | null;
 *   onSuccess: () => void;
 * }} props
 */
export function SubledgerFormModal({ open, onOpenChange, workspaceId, items, subledger, onSuccess }) {
  const [itemId, setItemId] = useState("");
  const [en, setEn] = useState("");
  const [ur, setUr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItemId(subledger?.item_id ? String(subledger.item_id) : "");
    setEn(String(subledger?.name?.en ?? ""));
    setUr(String(subledger?.name?.ur ?? ""));
  }, [open, subledger]);

  const activeItems = items.filter((item) => item.is_active !== false);
  const isEditing = Boolean(subledger?.id);

  async function handleSubmit(e) {
    e.preventDefault();
    const parentId = Number(itemId);
    const enName = en.trim();
    const urName = ur.trim();
    if (!parentId) {
      toast.error("Select a parent product");
      return;
    }
    if (!enName && !urName) {
      toast.error("Enter English or Urdu variant name");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        item_id: parentId,
        name: {
          en: enName || urName,
          ur: urName || enName,
        },
      };
      if (isEditing) {
        await updateSubledger(workspaceId, Number(subledger.id), payload);
        toast.success("Item variant updated");
      } else {
        await createSubledger(workspaceId, payload);
        toast.success("Item variant created");
      }
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item Variant" : "Add Item Variant"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label>Parent product</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose product" />
              </SelectTrigger>
              <SelectContent>
                {activeItems.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {getItemName(/** @type {Record<string, string>} */ (item.name))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>English variant</Label>
              <Input value={en} onChange={(e) => setEn(e.target.value)} dir="auto" />
            </div>
            <div className="space-y-1.5">
              <Label>Urdu variant</Label>
              <Input value={ur} onChange={(e) => setUr(e.target.value)} dir="auto" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : isEditing ? "Save changes" : "Save variant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
