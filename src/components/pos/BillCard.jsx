"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Receipt, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getItemName } from "@/lib/item-name";
import { money, formatWeight } from "@/lib/format";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function newInputLine(itemId = "", subledgerId = "") {
  return { id: `${Date.now()}-${Math.random()}`, itemId, subledgerId, qtyKg: "", unitPriceKg: "" };
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

/** @param {unknown} value */
function inputValue(value) {
  return value == null ? "" : String(value);
}

/** @param {number} itemId @param {number | string | null | undefined} subledgerId */
function stockKey(itemId, subledgerId) {
  return `${Number(itemId)}:${subledgerId == null || subledgerId === "" ? "base" : Number(subledgerId)}`;
}

/** @param {Record<string, unknown>} row */
function stockQty(row) {
  return Number(
    row.quantity_grams ??
      row.stock_grams ??
      row.total_quantity_grams ??
      row.available_quantity_grams ??
      row.available_grams ??
      row.quantity ??
      0
  );
}

/** @param {Array<Record<string, unknown>>} rows */
function buildStockMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const itemId = Number(row.item_id ?? row.itemId ?? row.item?.id);
    if (!itemId) continue;
    const subledgerId = row.subledger_id ?? row.subledgerId ?? null;
    const key = stockKey(itemId, subledgerId);
    map.set(key, (map.get(key) ?? 0) + stockQty(row));
  }
  return map;
}

/** @param {Map<string, number>} map @param {number} itemId @param {number | null} subledgerId */
function getStockQuantity(map, itemId, subledgerId) {
  const direct = map.get(stockKey(itemId, subledgerId));
  if (direct != null) return direct;
  return subledgerId == null ? 0 : map.get(stockKey(itemId, null)) ?? 0;
}

/**
 * @param {{
 *   sale: Record<string, unknown> | null;
 *   items: Array<Record<string, unknown>>;
 *   subledgers: Array<Record<string, unknown>>;
 *   shopStock?: Array<Record<string, unknown>>;
 *   warehouseStock?: Array<Record<string, unknown>>;
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
  shopStock = [],
  warehouseStock = [],
  busy,
  canEditCompleted = false,
  onStartSale,
  onAddItems,
  onUpdateItem,
  onDeleteItem,
  onApplyDiscount,
  onFinalize,
}) {
  const [lineInputs, setLineInputs] = useState(/** @type {Array<ReturnType<typeof newInputLine>>} */ ([]));
  const [editRows, setEditRows] = useState(/** @type {Record<string, { itemId: string; subledgerId: string; qtyKg: string; unitPriceKg: string }>} */ ({}));
  const [discount, setDiscount] = useState("0");
  const [query, setQuery] = useState("");

  const shopStockByKey = useMemo(() => buildStockMap(shopStock), [shopStock]);
  const warehouseStockByKey = useMemo(() => buildStockMap(warehouseStock), [warehouseStock]);

  const itemNameById = useMemo(() => {
    return new Map(items.map((item) => [Number(item.id), getItemName(/** @type {Record<string, string>} */ (item.name))]));
  }, [items]);

  const subledgerById = useMemo(() => {
    return new Map(subledgers.map((subledger) => [Number(subledger.id), subledger]));
  }, [subledgers]);

  const subledgersByItemId = useMemo(() => {
    const map = new Map();
    for (const subledger of subledgers) {
      if (subledger.is_active === false) continue;
      const itemId = Number(subledger.item_id);
      map.set(itemId, [...(map.get(itemId) ?? []), subledger]);
    }
    return map;
  }, [subledgers]);

  const catalogItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => item.is_active !== false)
      .map((item) => {
        const itemId = Number(item.id);
        const name = itemNameById.get(itemId) ?? `Item #${itemId}`;
        const variants = subledgersByItemId.get(itemId) ?? [];
        return { item, itemId, name, variants };
      })
      .filter(({ name, variants }) => {
        if (!normalized) return true;
        return (
          name.toLowerCase().includes(normalized) ||
          variants.some((variant) => getItemName(/** @type {Record<string, string>} */ (variant.name)).toLowerCase().includes(normalized))
        );
      });
  }, [itemNameById, items, query, subledgersByItemId]);

  const saleItems = Array.isArray(sale?.items) ? /** @type {Array<Record<string, unknown>>} */ (sale.items) : [];
  const isDraft = sale && String(sale.status) === "draft";
  const canEditSale = Boolean(sale && (isDraft || canEditCompleted));
  const totalQtyGrams = saleItems.reduce((sum, item) => sum + Number(item.quantity_grams ?? 0), 0);
  const pendingTotal = lineInputs.reduce((sum, line) => {
    const qty = Number(line.qtyKg);
    const price = Number(line.unitPriceKg);
    return sum + (Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0);
  }, 0);

  /** @param {number} itemId @param {number | null} subledgerId */
  function getAvailability(itemId, subledgerId = null) {
    const shopQty = getStockQuantity(shopStockByKey, itemId, subledgerId);
    const warehouseQty = getStockQuantity(warehouseStockByKey, itemId, subledgerId);
    if (shopQty > 0) {
      return {
        inShop: true,
        shopQty,
        warehouseQty,
        label: `Shop ${formatWeight(shopQty, "kg")}`,
        message: `Available in shop: ${formatWeight(shopQty, "kg")}. Warehouse: ${formatWeight(warehouseQty, "kg")}.`,
      };
    }
    if (warehouseQty > 0) {
      return {
        inShop: false,
        shopQty,
        warehouseQty,
        label: "Shop out",
        message: `Out of shop stock. Available in warehouse: ${formatWeight(warehouseQty, "kg")}. Transfer stock to shop before selling.`,
      };
    }
    return {
      inShop: false,
      shopQty,
      warehouseQty,
      label: "Out of stock",
      message: "Out of stock in shop and warehouse. This item cannot be sold.",
    };
  }

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

  /** @param {number} itemId @param {number | null} subledgerId */
  function addCatalogItem(itemId, subledgerId = null) {
    if (!canEditSale) {
      toast.error(sale ? "This bill cannot be edited" : "Start a new bill first");
      return;
    }
    const availability = getAvailability(itemId, subledgerId);
    if (!availability.inShop) {
      toast.error(availability.message);
      return;
    }
    setLineInputs((rows) => {
      const key = String(subledgerId ?? "");
      const existing = rows.find((row) => row.itemId === String(itemId) && row.subledgerId === key);
      if (!existing) return [...rows, newInputLine(String(itemId), key)];
      toast.message("Already selected. Edit quantity and price in the receipt.");
      return rows;
    });
  }

  /** @param {string} id @param {"qtyKg" | "unitPriceKg"} key @param {string} value */
  function updateInputLine(id, key, value) {
    setLineInputs((rows) => rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  /** @param {string} id */
  function removeInputLine(id) {
    setLineInputs((rows) => rows.filter((row) => row.id !== id));
  }

  /** @param {string} id @param {"qtyKg" | "unitPriceKg"} key @param {string} value */
  function updateEditRow(id, key, value) {
    setEditRows((rows) => {
      const current = rows[id] ?? { itemId: "", subledgerId: "", qtyKg: "0", unitPriceKg: "0" };
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
    if (lineInputs.length === 0) {
      toast.error("Select at least one item");
      return;
    }
    const payloads = [];
    for (const row of lineInputs) {
      const payload = buildPayload(row.itemId, row.subledgerId, row.qtyKg, row.unitPriceKg);
      if (!payload) return;
      payloads.push(payload);
    }
    await onAddItems(payloads);
    setLineInputs([]);
  }

  /** @param {Record<string, unknown>} line */
  async function saveLine(line) {
    const row = editRows[String(line.id)];
    const payload = buildPayload(row?.itemId ?? line.item_id, row?.subledgerId ?? line.subledger_id, row?.qtyKg, row?.unitPriceKg);
    if (!payload) return;
    await onUpdateItem(Number(line.id), payload);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Sales terminal</CardTitle>
          <CardDescription>
            {sale ? `Bill #${sale.id} - ${String(sale.status)}` : "Start a bill, tap products, then edit price and quantity in the receipt."}
          </CardDescription>
        </div>
        <Button type="button" variant="secondary" onClick={onStartSale} disabled={busy} className="shrink-0">
          {busy && <Loader2 className="size-4 animate-spin" />}
          New bill
        </Button>
      </CardHeader>

      <CardContent className="grid min-h-[calc(100svh-13rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-[family:var(--font-outfit),system-ui,sans-serif] text-xl font-semibold">
                Main items
              </h2>
              <p className="text-sm text-muted-foreground">Every parent item stays visible; variants appear as quick-select buttons.</p>
            </div>
            <div className="relative lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                placeholder="Search item or variant"
              />
            </div>
          </div>

          {!sale && (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Create a new bill before selecting items.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {catalogItems.map(({ itemId, name, variants }) => {
              const hasVariants = variants.length > 0;
              const baseAvailability = getAvailability(itemId, null);
              const variantAvailability = variants.map((variant) => getAvailability(itemId, Number(variant.id)));
              const hasSelectableVariant = variantAvailability.some((availability) => availability.inShop);
              const cardUnavailable = hasVariants ? !hasSelectableVariant : !baseAvailability.inShop;
              const cardMessage = hasVariants && cardUnavailable ? "All variants are out of shop stock." : baseAvailability.message;
              return (
                <div
                  key={itemId}
                  className={`group relative min-h-40 rounded-md border p-4 shadow-sm ${
                    cardUnavailable ? "border-border bg-muted/45 text-muted-foreground" : "border-border bg-elevated"
                  }`}
                  title={cardMessage}
                >
                  {cardUnavailable && (
                    <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 hidden rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background shadow-md group-hover:block">
                      {cardMessage}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!canEditSale || (!hasVariants && !baseAvailability.inShop)}
                    onClick={() => !hasVariants && addCatalogItem(itemId, null)}
                    className="mb-3 block w-full rounded-md text-left disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="block text-lg font-semibold leading-tight">{name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {hasVariants ? `${variants.length} variant${variants.length === 1 ? "" : "s"}` : "No variant"}
                    </span>
                    {!hasVariants && (
                      <span className={`mt-2 inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${baseAvailability.inShop ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                        {baseAvailability.label}
                      </span>
                    )}
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {hasVariants ? (
                      variants.map((variant) => {
                        const availability = getAvailability(itemId, Number(variant.id));
                        const variantName = getItemName(/** @type {Record<string, string>} */ (variant.name));
                        return (
                          <span key={variant.id} className="group/variant relative inline-flex max-w-full" title={availability.message}>
                            {!availability.inShop && (
                              <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background shadow-md group-hover/variant:block">
                                {availability.message}
                              </span>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!canEditSale || !availability.inShop}
                              onClick={() => addCatalogItem(itemId, Number(variant.id))}
                              className={`h-8 max-w-full px-2 ${!availability.inShop ? "border border-border bg-muted text-muted-foreground" : ""}`}
                              aria-label={`${variantName}. ${availability.message}`}
                            >
                              <span className="truncate">{variantName}</span>
                            </Button>
                          </span>
                        );
                      })
                    ) : (
                      <Button type="button" size="sm" disabled={!canEditSale || !baseAvailability.inShop} onClick={() => addCatalogItem(itemId, null)}>
                        <Plus className="size-4" />
                        Add item
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {catalogItems.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No matching items found.
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-4 rounded-md border border-border bg-background/70 p-4 xl:sticky xl:top-20 xl:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-[family:var(--font-outfit),system-ui,sans-serif] text-xl font-semibold">
                Live receipt
              </h2>
              <p className="text-sm text-muted-foreground">{sale ? `Bill #${sale.id}` : "No bill selected"}</p>
            </div>
            {sale && <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize">{String(sale.status)}</span>}
          </div>

          {lineInputs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Selected items</p>
                <p className="text-xs text-muted-foreground tabular-nums">{money(pendingTotal)}</p>
              </div>
              {lineInputs.map((line) => (
                <ReceiptDraftLine
                  key={line.id}
                  line={line}
                  itemName={itemNameById.get(Number(line.itemId)) ?? `Item #${line.itemId}`}
                  variantName={line.subledgerId ? getItemName(/** @type {Record<string, string>} */ (subledgerById.get(Number(line.subledgerId))?.name ?? {})) : "No variant"}
                  busy={busy}
                  onChange={updateInputLine}
                  onRemove={removeInputLine}
                />
              ))}
              <Button type="button" onClick={addLines} disabled={busy || !canEditSale} className="w-full">
                <Save className="size-4" />
                Save selected items
              </Button>
            </section>
          )}

          {sale && (
            <section className="space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-md border border-border/80 bg-muted/25 p-3 text-sm">
                <Summary label="Items" value={String(saleItems.length)} />
                <Summary label="Quantity" value={formatWeight(totalQtyGrams, "kg")} />
                <Summary label="Subtotal" value={money(sale.subtotal_amount)} />
                <Summary label="Total" value={money(sale.total_amount)} />
              </div>

              <div className="max-h-[34vh] space-y-2 overflow-y-auto pr-1">
                {saleItems.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No saved items yet.
                  </div>
                ) : (
                  saleItems.map((line) => (
                    <SavedReceiptLine
                      key={line.id}
                      line={line}
                      row={editRows[String(line.id)]}
                      itemName={itemNameById.get(Number(line.item_id)) ?? `Item #${line.item_id}`}
                      variantName={line.subledger_id ? getItemName(/** @type {Record<string, string>} */ (subledgerById.get(Number(line.subledger_id))?.name ?? {})) : "No variant"}
                      busy={busy}
                      canEditSale={canEditSale}
                      onChange={updateEditRow}
                      onSave={saveLine}
                      onDelete={onDeleteItem}
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {sale && (isDraft || canEditCompleted) && (
            <section className="space-y-3 border-t border-border pt-4">
              <div className="space-y-2">
                <Label>Discount (PKR)</Label>
                <Input value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => onApplyDiscount(discount)} disabled={busy}>
                  Update
                </Button>
                {isDraft && (
                  <Button type="button" variant="accent" onClick={onFinalize} disabled={busy || saleItems.length === 0}>
                    <Receipt className="size-4" />
                    Finalize
                  </Button>
                )}
              </div>
            </section>
          )}
        </aside>
      </CardContent>
    </Card>
  );
}

function ReceiptDraftLine({ line, itemName, variantName, busy, onChange, onRemove }) {
  const lineTotal = Number(line.qtyKg || 0) * Number(line.unitPriceKg || 0);
  return (
    <div className="space-y-3 rounded-md border border-border/80 bg-elevated p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{itemName}</p>
          <p className="truncate text-xs text-muted-foreground">{variantName}</p>
        </div>
        <Button type="button" variant="outline" size="iconSm" disabled={busy} onClick={() => onRemove(line.id)} aria-label={`Remove ${itemName}`}>
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Qty kg">
          <Input value={line.qtyKg} onChange={(e) => onChange(line.id, "qtyKg", e.target.value)} type="number" min="0.001" step="0.001" />
        </Field>
        <Field label="Price / kg">
          <Input value={line.unitPriceKg} onChange={(e) => onChange(line.id, "unitPriceKg", e.target.value)} inputMode="decimal" />
        </Field>
      </div>
      <p className="text-right text-sm font-semibold tabular-nums">{money(lineTotal)}</p>
    </div>
  );
}

function SavedReceiptLine({ line, row, itemName, variantName, busy, canEditSale, onChange, onSave, onDelete }) {
  const current = row ?? {
    itemId: String(line.item_id ?? ""),
    subledgerId: line.subledger_id != null ? String(line.subledger_id) : "",
    qtyKg: String(Number(line.quantity_grams ?? 0) / 1000),
    unitPriceKg: gramPriceToKg(inputValue(line.unit_price ?? 0)),
  };

  return (
    <div className="space-y-3 rounded-md border border-border/80 bg-elevated p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{itemName}</p>
          <p className="truncate text-xs text-muted-foreground">{variantName}</p>
        </div>
        <p className="text-right text-sm font-semibold tabular-nums">{money(line.total_price)}</p>
      </div>
      {canEditSale ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Qty kg">
              <Input value={current.qtyKg} onChange={(e) => onChange(String(line.id), "qtyKg", e.target.value)} type="number" min="0.001" step="0.001" />
            </Field>
            <Field label="Price / kg">
              <Input value={current.unitPriceKg} onChange={(e) => onChange(String(line.id), "unitPriceKg", e.target.value)} inputMode="decimal" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onSave(line)} disabled={busy}>
              <Save className="size-4" />
              Save
            </Button>
            <Button type="button" variant="outline" size="iconSm" onClick={() => onDelete(Number(line.id))} disabled={busy} aria-label="Remove line">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>{formatWeight(Number(line.quantity_grams ?? 0), "kg")}</span>
          <span className="text-right">{money(gramPriceToKg(inputValue(line.unit_price ?? 0)))} / kg</span>
        </div>
      )}
    </div>
  );
}

/** @param {{ label: string; value: string }} props */
function Summary({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** @param {{ label: string; children: React.ReactNode }} props */
function Field({ label, children }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="block truncate text-xs">{label}</Label>
      {children}
    </div>
  );
}
