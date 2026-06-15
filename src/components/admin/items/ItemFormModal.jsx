"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createItem, updateItem } from "@/api";
import { ApiError } from "@/api/client";
import { Button } from "@/components/common/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   workspaceId: number;
 *   item?: Record<string, unknown> | null;
 *   onSuccess: () => void;
 * }} props
 */
export function ItemFormModal({ open, onOpenChange, workspaceId, item, onSuccess }) {
  const [en, setEn] = useState("");
  const [ur, setUr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEn(String(item?.name?.en ?? ""));
    setUr(String(item?.name?.ur ?? ""));
  }, [item, open]);

  const isEditing = Boolean(item?.id);

  async function handleSubmit(e) {
    e.preventDefault();
    const enName = en.trim();
    const urName = ur.trim();
    if (!enName && !urName) {
      toast.error("Enter English or Urdu name");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: {
          en: enName || urName,
          ur: urName || enName,
        },
        unit_type: "kg",
      };
      if (isEditing) {
        await updateItem(workspaceId, Number(item.id), payload);
        toast.success("Main item updated");
      } else {
        await createItem(workspaceId, payload);
        toast.success("Main item created");
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
          <DialogTitle>{isEditing ? "Edit Main Item" : "Add Main Item"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>English name</Label>
              <Input value={en} onChange={(e) => setEn(e.target.value)} dir="auto" />
            </div>
            <div className="space-y-1.5">
              <Label>Urdu name</Label>
              <Input value={ur} onChange={(e) => setUr(e.target.value)} dir="auto" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Input value="kg" disabled />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : isEditing ? "Save changes" : "Save item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
