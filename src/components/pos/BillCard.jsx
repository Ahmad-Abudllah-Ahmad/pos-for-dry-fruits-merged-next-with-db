"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Receipt, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getItemName } from "@/lib/item-name";
import { money, formatWeight } from "@/lib/format";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function newInputLine() {
  return { id: `${Date.now()}-${Math.random()}`, itemId: "", subledgerId: "", qtyKg: "0.5", unitPriceKg: "1000" };
}

/** @param {string | number} value */
function kgToGrams(value) {
  const kg = parseFloat(String(value));
  if (!Number.isFinite(kg) || kg <= 0) return null;
  const grams = Math.round(kg * 1000);
  return grams >= 1 ? grams : null;
}

/** @param {string | number} value */
function priceKgToGram(value) {
  const pricePerKg = parseFloat(String(value));
  if (!Number.isFinite(pricePerKg) || pricePerKg < 0) return null;
  return String(pricePerKg / 1000);
}

/** @param {string | number} value */
function gramPriceToKg(value) {
  const n = parseFloat(String(value));
  if (!Number.isFinite(n)) return "0";
  return String(n * 1000);
}

/**
 * @param {{
 *   sale: Record<string, unknown> | null;
 *   items: Array<Record<string, unknown>>;
 *   subledgers: Array<Record<string, unknown>>;
 *   busy: boolean;
 *   canEditCompleted?: boolean;
 *   onStartSale: () => void;
 *   onAddItems: (payloads: Array<{ item_id: number; subledger_id?: number | null; quantity_grams: number; unit_price: string }>) => Promise<void>;
 *   onUpdateItem: (saleItemId: number, payload: { item_id: number; subledger_id?: number | null; quantity_grams: number; unit_price: string }) => Promise<void>;
 *   onDeleteItem: (saleItemId: number) => Promise<void>;
 *   onApplyDiscount: (discount: string) => Promise<void>;
 *   onFinalize: () => Promise<void>;
 * }} props
 */
export function BillCard({
  sale,
  items,
  subledgers,
  busy,
  canEditCompleted = false,
  onStartSale,
  onAddItems,
  onUpdateItem,
  onDeleteItem,
  onApplyDiscount,
  onFinalize,
}) {
  const [lineInputs, setLineInputs] = useState([newInputLine()]);
  const [editRows, setEditRows] = useState(/** @type {Record<string, { itemId: string; subledgerId: string; qtyKg: string; unitPriceKg: string }>} */ ({}));
  const [discount, setDiscount] = useState("0");

  const itemNameById = useMemo(() => {
    return new Map(items.map((item) => [Number(item.id), getItemName(/** @type {Record<string, string>} */ (item.name))]));
  }, [items]);
  const subledgerById = useMemo(() => {
    return new Map(subledgers.map((subledger) => [Number(subledger.id), subledger]));
  }, [subledgers]);
  const subledgersByItemId = useMemo(() => {
    const map = new Map();
    for (const subledger of subledgers) {
      const itemId = Number(subledger.item_id);
      map.set(itemId, [...(map.get(itemId) ?? []), subledger]);
    }
    return map;
  }, [subledgers]);

  const saleItems = Array.isArray(sale?.items) ? /** @type {Array<Record<string, unknown>>} */ (sale.items) : [];
  const isDraft = sale && String(sale.status) === "draft";
  const canEditSale = Boolean(sale && (isDraft || canEditCompleted));
  const totalQtyGrams = saleItems.reduce((sum, item) => sum + Number(item.quantity_grams ?? 0), 0);

  useEffect(() => {
    setDiscount(String(sale?.discount_amount ?? "0"));
    const itemsInSale = Array.isArray(sale?.items) ? /** @type {Array<Record<string, unknown>>} */ (sale.items) : [];
    const nextRows = Object.fromEntries(
      itemsInSale.map((item) => [
        String(item.id),
        {
          itemId: String(item.item_id ?? ""),
          subledgerId: item.subledger_id != null ? String(item.subledger_id) : "",
          qtyKg: String(Number(item.quantity_grams ?? 0) / 1000),
          unitPriceKg: gramPriceToKg(/** @type {string | number} */ (item.unit_price ?? 0)),
        },
      ])
    );
    setEditRows(nextRows);
  }, [sale]);

  /** @param {string} id @param {"itemId" | "subledgerId" | "qtyKg" | "unitPriceKg"} key @param {string} value */
  function updateInputLine(id, key, value) {
    setLineInputs((rows) => rows.map((row) => {
      if (row.id !== id) return row;
      if (key === "itemId") return { ...row, itemId: value, subledgerId: "" };
      if (key === "subledgerId") {
        return {
          ...row,
          subledgerId: value,
        };
      }
      return { ...row, [key]: value };
    }));
  }

  /** @param {string} id */
  function removeInputLine(id) {
    setLineInputs((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  }

  /** @param {string} id @param {"itemId" | "subledgerId" | "qtyKg" | "unitPriceKg"} key @param {string} value */
  function updateEditRow(id, key, value) {
    setEditRows((rows) => {
      const current = rows[id];
      if (key === "itemId") return { ...rows, [id]: { ...current, itemId: value, subledgerId: "" } };
      if (key === "subledgerId") {
        return {
          ...rows,
          [id]: {
            ...current,
            subledgerId: value,
          },
        };
      }
      return { ...rows, [id]: { ...current, [key]: value } };
    });
  }

  function buildPayload(itemIdValue, subledgerIdValue, qtyKgValue, priceKgValue) {
    const itemId = Number(itemIdValue);
    const subledgerId = subledgerIdValue ? Number(subledgerIdValue) : null;
    const quantityGrams = kgToGrams(qtyKgValue);
    const unitPrice = priceKgToGram(priceKgValue);
    if (!itemId || quantityGrams == null) {
      toast.error("Invalid item or quantity (kg)");
      return null;
    }
    if (unitPrice == null) {
      toast.error("Invalid price per kg");
      return null;
    }
    return { item_id: itemId, subledger_id: subledgerId, quantity_grams: quantityGrams, unit_price: unitPrice };
  }

  async function addLines() {
    const payloads = [];
    for (const row of lineInputs) {
      const payload = buildPayload(row.itemId, row.subledgerId, row.qtyKg, row.unitPriceKg);
      if (!payload) return;
      payloads.push(payload);
    }
    await onAddItems(payloads);
    setLineInputs([newInputLine()]);
  }

  /** @param {Record<string, unknown>} line */
  async function saveLine(line) {
    const row = editRows[String(line.id)];
    const payload = buildPayload(row?.itemId, row?.subledgerId, row?.qtyKg, row?.unitPriceKg);
    if (!payload) return;
    await onUpdateItem(Number(line.id), payload);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Current bill</CardTitle>
          <CardDescription>
            {sale ? `Bill #${sale.id} - ${String(sale.status)}` : "No bill selected"}
          </CardDescription>
        </div>
        <Button type="button" variant="secondary" onClick={onStartSale} disabled={busy} className="shrink-0">
          {busy && <Loader2 className="size-4 animate-spin" />}
          New bill
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {canEditSale && (
          <div className="space-y-3">
            {lineInputs.map((line, index) => (
              <div key={line.id} className="grid gap-3 rounded-md border border-border/80 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_190px_auto] sm:items-end">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={line.itemId} onValueChange={(value) => updateInputLine(line.id, "itemId", value)}>
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
                  <Label>Variant</Label>
                  <Select
                    value={line.subledgerId || "standalone"}
                    onValueChange={(value) => updateInputLine(line.id, "subledgerId", value === "standalone" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Standalone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standalone">Standalone</SelectItem>
                      {(subledgersByItemId.get(Number(line.itemId)) ?? [])
                        .filter((subledger) => subledger.is_active !== false)
                        .map((subledger) => (
                          <SelectItem key={subledger.id} value={String(subledger.id)}>
                            {getItemName(/** @type {Record<string, string>} */ (subledger.name))}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity (kg)</Label>
                  <Input value={line.qtyKg} onChange={(e) => updateInputLine(line.id, "qtyKg", e.target.value)} type="number" min="0.001" step="0.001" />
                </div>
                <div className="space-y-2">
                  <Label>Price (PKR / kg)</Label>
                  <Input value={line.unitPriceKg} onChange={(e) => updateInputLine(line.id, "unitPriceKg", e.target.value)} inputMode="decimal" />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => removeInputLine(line.id)} disabled={busy || lineInputs.length === 1} aria-label={`Remove line ${index + 1}`}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setLineInputs((rows) => [...rows, newInputLine()])} disabled={busy}>
                <Plus className="size-4" />
                Add item
              </Button>
              <Button type="button" onClick={addLines} disabled={busy}>
                <Plus className="size-4" />
                Add to bill
              </Button>
            </div>
          </div>
        )}

        {sale && (
          <div className="space-y-3">
            <div className="grid gap-2 rounded-md border border-border/80 bg-muted/25 p-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Items</p>
                <p className="font-semibold tabular-nums">{saleItems.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-semibold tabular-nums">{formatWeight(totalQtyGrams, "kg")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Subtotal</p>
                <p className="font-semibold tabular-nums">{money(sale.subtotal_amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold tabular-nums">{money(sale.total_amount)}</p>
              </div>
            </div>

            {saleItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    {canEditSale && <TableHead>Variant</TableHead>}
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {canEditSale && <TableHead className="w-24 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.map((line) => {
                    const row = editRows[String(line.id)] ?? {
                      itemId: String(line.item_id ?? ""),
                      subledgerId: line.subledger_id != null ? String(line.subledger_id) : "",
                      qtyKg: "0",
                      unitPriceKg: "0",
                    };
                    const subledger = subledgerById.get(Number(line.subledger_id));
                    return (
                      <TableRow key={line.id}>
                        <TableCell className="min-w-48 font-medium">
                          {canEditSale ? (
                            <Select value={row.itemId} onValueChange={(value) => updateEditRow(String(line.id), "itemId", value)}>
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
                          ) : (
                            <>
                              {itemNameById.get(Number(line.item_id)) ?? `Item #${line.item_id}`}
                              {subledger && (
                                <span className="block text-xs font-normal text-muted-foreground">
                                  {getItemName(/** @type {Record<string, string>} */ (subledger.name))}
                                </span>
                              )}
                            </>
                          )}
                        </TableCell>
                        {canEditSale && (
                          <TableCell className="min-w-44">
                            <Select
                              value={row.subledgerId || "standalone"}
                              onValueChange={(value) => updateEditRow(String(line.id), "subledgerId", value === "standalone" ? "" : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Standalone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standalone">Standalone</SelectItem>
                                {(subledgersByItemId.get(Number(row.itemId)) ?? [])
                                  .filter((variant) => variant.is_active !== false)
                                  .map((variant) => (
                                    <SelectItem key={variant.id} value={String(variant.id)}>
                                      {getItemName(/** @type {Record<string, string>} */ (variant.name))}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        <TableCell className="w-32">
                          {canEditSale ? (
                            <Input value={row.qtyKg} onChange={(e) => updateEditRow(String(line.id), "qtyKg", e.target.value)} type="number" min="0.001" step="0.001" />
                          ) : (
                            formatWeight(Number(line.quantity_grams ?? 0), "kg")
                          )}
                        </TableCell>
                        <TableCell className="min-w-52">
                          {canEditSale ? (
                            <Input value={row.unitPriceKg} onChange={(e) => updateEditRow(String(line.id), "unitPriceKg", e.target.value)} inputMode="decimal" />
                          ) : (
                            `${money(gramPriceToKg(/** @type {string | number} */ (line.unit_price ?? 0)))} / kg`
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">{money(line.total_price)}</TableCell>
                        {canEditSale && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button type="button" variant="outline" size="iconSm" onClick={() => saveLine(line)} disabled={busy} aria-label="Save line">
                                <Save className="size-4" />
                              </Button>
                              <Button type="button" variant="outline" size="iconSm" onClick={() => onDeleteItem(Number(line.id))} disabled={busy} aria-label="Remove line">
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {sale && (isDraft || canEditCompleted) && (
          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
            <div className="space-y-2">
              <Label>Discount (PKR)</Label>
              <Input value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <Button type="button" variant="outline" onClick={() => onApplyDiscount(discount)} disabled={busy}>
              Update discount
            </Button>
            {isDraft && (
              <Button type="button" variant="accent" onClick={onFinalize} disabled={busy}>
                <Receipt className="size-4" />
                Finalize
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
