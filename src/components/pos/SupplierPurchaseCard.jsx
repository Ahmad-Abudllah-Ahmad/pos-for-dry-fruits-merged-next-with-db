"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, PackagePlus, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getItemName } from "@/lib/item-name";
import { formatWeight, money } from "@/lib/format";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { Badge } from "@/components/ui/badge";
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
  return {
    id: `${Date.now()}-${Math.random()}`,
    itemId: "",
    subledgerId: "",
    totalQtyKg: "",
    cartons: "",
    totalPrice: "",
  };
}

function newLine() {
  return { itemId: "", subledgerId: "", totalQtyKg: "", cartons: "", totalPrice: "" };
}

/** @param {string | number} value */
function kgToGrams(value) {
  const kg = parseFloat(String(value));
  if (!Number.isFinite(kg) || kg <= 0) return null;
  const grams = Math.round(kg * 1000);
  return grams >= 1 ? grams : null;
}

/** @param {string | number} value */
function numberValue(value) {
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/** @param {string | number} grams */
function gramsToKgInput(grams) {
  const n = Number(grams);
  if (!Number.isFinite(n)) return "0";
  return String(n / 1000);
}

/** Keeps inputs controlled; avoids undefined to defined React warnings. @param {unknown} v */
function inputValue(v) {
  return v == null ? "" : String(v);
}

/**
 * @param {{
 *   mode: "purchase" | "ledger";
 *   onModeChange: (mode: "purchase" | "ledger") => void;
 *   purchase: Record<string, unknown> | null;
 *   ledger: Record<string, unknown> | null;
 *   items: Array<Record<string, unknown>>;
 *   subledgers: Array<Record<string, unknown>>;
 *   busy: boolean;
 *   canEditCompleted?: boolean;
 *   onStartPurchase: (payload: Record<string, unknown>) => Promise<void>;
 *   onUpdatePurchase: (payload: Record<string, unknown>) => Promise<void>;
 *   onAddItems: (payloads: Array<Record<string, unknown>>) => Promise<void>;
 *   onUpdateItem: (purchaseItemId: number, payload: Record<string, unknown>) => Promise<void>;
 *   onDeleteItem: (purchaseItemId: number) => Promise<void>;
 *   onFinalize: () => Promise<void>;
 *   onAddPayment: (purchaseId: number, payload: { amount: string; payment_method?: string | null; note?: string | null }) => Promise<void>;
 *   onStartLedger: (payload: Record<string, unknown>) => Promise<void>;
 *   onUpdateLedger: (payload: Record<string, unknown>) => Promise<void>;
 *   onAddLedgerItems: (payloads: Array<Record<string, unknown>>) => Promise<void>;
 *   onUpdateLedgerItem: (ledgerItemId: number, payload: Record<string, unknown>) => Promise<void>;
 *   onDeleteLedgerItem: (ledgerItemId: number) => Promise<void>;
 *   onFinalizeLedger: () => Promise<void>;
 *   onAddLedgerPayment: (ledgerId: number, payload: { amount: string; payment_method?: string | null; note?: string | null }) => Promise<void>;
 * }} props
 */
export function SupplierPurchaseCard(props) {
  const {
    mode,
    onModeChange,
    purchase,
    ledger,
    items,
    subledgers,
    busy,
    canEditCompleted = false,
    onStartPurchase,
    onUpdatePurchase,
    onAddItems,
    onUpdateItem,
    onDeleteItem,
    onFinalize,
    onAddPayment,
    onStartLedger,
    onUpdateLedger,
    onAddLedgerItems,
    onUpdateLedgerItem,
    onDeleteLedgerItem,
    onFinalizeLedger,
    onAddLedgerPayment,
  } = props;

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

  const itemNameById = useMemo(() => {
    return new Map(items.map((item) => [Number(item.id), getItemName(/** @type {Record<string, string>} */ (item.name))]));
  }, [items]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Stock partner entry</CardTitle>
            <CardDescription>
              Use the same section for supplier purchases and dealer sale ledgers with flexible later payments.
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-md border border-border/80 p-1">
            <Button type="button" variant={mode === "purchase" ? "default" : "ghost"} size="sm" onClick={() => onModeChange("purchase")} disabled={busy}>
              Supplier purchase
            </Button>
            <Button type="button" variant={mode === "ledger" ? "default" : "ghost"} size="sm" onClick={() => onModeChange("ledger")} disabled={busy}>
              Dealer sale
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "purchase" ? (
          <PurchaseModeSection
            purchase={purchase}
            items={items}
            subledgersByItemId={subledgersByItemId}
            subledgerById={subledgerById}
            itemNameById={itemNameById}
            busy={busy}
            canEditCompleted={canEditCompleted}
            onStartPurchase={onStartPurchase}
            onUpdatePurchase={onUpdatePurchase}
            onAddItems={onAddItems}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onFinalize={onFinalize}
            onAddPayment={onAddPayment}
          />
        ) : (
          <LedgerModeSection
            ledger={ledger}
            items={items}
            subledgersByItemId={subledgersByItemId}
            subledgerById={subledgerById}
            itemNameById={itemNameById}
            busy={busy}
            onStartLedger={onStartLedger}
            onUpdateLedger={onUpdateLedger}
            onAddItems={onAddLedgerItems}
            onUpdateItem={onUpdateLedgerItem}
            onDeleteItem={onDeleteLedgerItem}
            onFinalize={onFinalizeLedger}
            onAddPayment={onAddLedgerPayment}
          />
        )}
      </CardContent>
    </Card>
  );
}

function PurchaseModeSection({
  purchase,
  items,
  subledgersByItemId,
  subledgerById,
  itemNameById,
  busy,
  canEditCompleted,
  onStartPurchase,
  onUpdatePurchase,
  onAddItems,
  onUpdateItem,
  onDeleteItem,
  onFinalize,
  onAddPayment,
}) {
  const [supplier, setSupplier] = useState("Supplier");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [lineInputs, setLineInputs] = useState([newInputLine()]);
  const [editRows, setEditRows] = useState(/** @type {Record<string, ReturnType<typeof newLine>>} */ ({}));

  const purchaseItems = useMemo(() => (Array.isArray(purchase?.items) ? purchase.items : []), [purchase]);
  const isDraft = purchase && String(purchase.status) === "draft";
  const canEditSlip = Boolean(purchase && (isDraft || canEditCompleted));
  const canRecordPayment = Boolean(purchase && !isDraft && String(purchase.payment_status) !== "paid");

  useEffect(() => {
    setLineInputs([newInputLine()]);
  }, [purchase?.id]);

  useEffect(() => {
    setSupplier(String(purchase?.supplier_name ?? "Supplier"));
    setPaymentMethod(String(purchase?.payment_method ?? ""));
    setPaymentStatus(String(purchase?.payment_status ?? "paid"));
    setPaidAmount(
      purchase && String(purchase.status) !== "draft"
        ? ""
        : purchase?.paid_amount != null && Number(purchase.paid_amount) > 0
          ? String(purchase.paid_amount)
          : ""
    );
    setPaymentNote("");
    const rows = {};
    for (const item of Array.isArray(purchase?.items) ? purchase.items : []) {
      rows[String(item.id)] = {
        itemId: String(item.item_id ?? ""),
        subledgerId: item.subledger_id != null ? String(item.subledger_id) : "",
        totalQtyKg: gramsToKgInput(/** @type {string | number} */ (item.total_weight_grams ?? 0)),
        cartons: String(item.quantity ?? ""),
        totalPrice: String(item.total_cost ?? ""),
      };
    }
    setEditRows(rows);
  }, [purchase]);

  const totals = purchaseItems.reduce(
    (acc, item) => {
      acc.items += 1;
      acc.cartons += Number(item.quantity ?? 0);
      acc.grams += Number(item.total_weight_grams ?? 0);
      acc.price += Number(item.total_cost ?? 0);
      return acc;
    },
    { items: 0, cartons: 0, grams: 0, price: 0 }
  );

  function buildPayload(line) {
    const itemId = Number(line.itemId);
    const totalGrams = kgToGrams(line.totalQtyKg);
    const cartons = parseInt(String(line.cartons), 10);
    const totalPrice = numberValue(line.totalPrice);
    if (!itemId || totalGrams == null || !Number.isFinite(cartons) || cartons < 1) {
      toast.error("Select product and enter total quantity (kg) and cartons received");
      return null;
    }
    if (totalPrice == null || totalPrice <= 0) {
      toast.error("Enter total line price");
      return null;
    }
    return {
      item_id: itemId,
      subledger_id: line.subledgerId ? Number(line.subledgerId) : null,
      quantity: cartons,
      total_weight_grams: totalGrams,
      total_cost: String(totalPrice),
    };
  }

  function detailsPayload() {
    const supplierName = supplier.trim();
    if (!supplierName) {
      toast.error("Enter supplier name");
      return null;
    }
    return {
      supplier_name: supplierName,
      payment_method: paymentMethod.trim() || null,
      payment_status: paymentStatus,
      paid_amount: paidAmount.trim() ? paidAmount.trim() : null,
      payment_note: paymentNote.trim() || null,
    };
  }

  async function startSlip() {
    await onStartPurchase({
      supplier_name: "Supplier",
      payment_method: null,
      payment_status: "installments",
      paid_amount: null,
      payment_note: null,
    });
  }

  async function saveDetails() {
    const payload = detailsPayload();
    if (!payload) return;
    await onUpdatePurchase(payload);
  }

  async function finalizeSlip() {
    const payload = detailsPayload();
    if (!payload) return;
    await onUpdatePurchase(payload);
    await onFinalize();
  }

  function updateInputLine(id, key, value) {
    setLineInputs((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;
        if (key === "itemId") return { ...row, itemId: value, subledgerId: "" };
        return { ...row, [key]: value };
      })
    );
  }

  function removeInputLine(id) {
    setLineInputs((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  }

  async function addLinesToSlip() {
    if (!purchase) {
      toast.error("Start a supplier slip first");
      return;
    }
    const payloads = [];
    for (const row of lineInputs) {
      const payload = buildPayload(row);
      if (!payload) return;
      payloads.push(payload);
    }
    await onAddItems(payloads);
    setLineInputs([newInputLine()]);
  }

  function updateEditRow(id, key, value) {
    setEditRows((state) => {
      const row = state[id] ?? newLine();
      if (key === "itemId") return { ...state, [id]: { ...row, itemId: value, subledgerId: "" } };
      return { ...state, [id]: { ...row, [key]: value } };
    });
  }

  async function saveLine(item) {
    const payload = buildPayload(editRows[String(item.id)] ?? newLine());
    if (!payload) return;
    await onUpdateItem(Number(item.id), payload);
  }

  async function addPayment() {
    if (!purchase?.id) return;
    const amount = numberValue(paidAmount);
    if (amount == null || amount <= 0) {
      toast.error("Enter payment amount");
      return;
    }
    await onAddPayment(Number(purchase.id), {
      amount: String(amount),
      payment_method: paymentMethod.trim() || null,
      note: paymentNote.trim() || null,
    });
    setPaidAmount("");
    setPaymentNote("");
  }

  return (
    <ModeScaffold
      title="Supplier stock entry"
      description={purchase ? `Slip #${purchase.id} - ${String(purchase.status)}` : "No supplier slip selected"}
      busy={busy}
      buttonLabel="New slip"
      onStart={startSlip}
      emptyText="Start a new supplier slip, add products, then finalize it into warehouse stock."
      record={purchase}
      summary={{
        items: String(totals.items),
        secondaryCountLabel: "Cartons/Bags",
        secondaryCountValue: String(totals.cartons),
        quantity: formatWeight(totals.grams, "kg"),
        total: money(totals.price),
      }}
      detailsTitle="Slip details"
      status={purchase?.status}
      canEditRecord={canEditSlip}
      canRecordPayment={canRecordPayment}
      nameLabel="Supplier"
      nameValue={supplier}
      onNameChange={setSupplier}
      paymentMethod={paymentMethod}
      onPaymentMethodChange={setPaymentMethod}
      paymentStatus={paymentStatus}
      onPaymentStatusChange={setPaymentStatus}
      paidAmount={paidAmount}
      onPaidAmountChange={setPaidAmount}
      paymentNote={paymentNote}
      onPaymentNoteChange={setPaymentNote}
      saveLabel="Save details"
      onSaveDetails={saveDetails}
      addPaymentLabel="Add payment"
      onAddPayment={addPayment}
      canAddItems={canEditSlip}
      addItemsTitle="Add products"
      addItemsPrimaryLabel="Add to slip"
      lineInputs={lineInputs}
      updateInputLine={updateInputLine}
      removeInputLine={removeInputLine}
      onAddInputRow={() => setLineInputs((rows) => [...rows, newInputLine()])}
      onAddLines={addLinesToSlip}
      items={items}
      subledgersByItemId={subledgersByItemId}
      itemLabel="Product"
      quantityLabel="Total qty received (kg)"
      countLabel="Cartons received"
      totalLabel="Total price"
      rows={purchaseItems}
      editRows={editRows}
      updateEditRow={updateEditRow}
      saveRow={saveLine}
      deleteRow={(id) => onDeleteItem(Number(id))}
      itemNameById={itemNameById}
      subledgerById={subledgerById}
      footerText={purchase ? `Paid ${money(purchase.paid_amount)} / left ${money(purchase.remaining_amount)}` : ""}
      rowTotal={(item) => money(item.total_cost)}
      rowTotalDisplayLabel="Line total"
      totalDisplay={(item) => money(item.total_cost)}
      countDisplay={(item) => String(item.quantity)}
      quantityDisplay={(item) => formatWeight(Number(item.total_weight_grams ?? 0), "kg")}
      canFinalize={isDraft}
      finalizeLabel="Finalize slip"
      onFinalize={finalizeSlip}
    />
  );
}

function LedgerModeSection({
  ledger,
  items,
  subledgersByItemId,
  subledgerById,
  itemNameById,
  busy,
  onStartLedger,
  onUpdateLedger,
  onAddItems,
  onUpdateItem,
  onDeleteItem,
  onFinalize,
  onAddPayment,
}) {
  const [dealer, setDealer] = useState("Dealer");
  const [dealerPhone, setDealerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("installments");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [lineInputs, setLineInputs] = useState([newInputLine()]);
  const [editRows, setEditRows] = useState(/** @type {Record<string, ReturnType<typeof newLine>>} */ ({}));

  const ledgerItems = useMemo(() => (Array.isArray(ledger?.items) ? ledger.items : []), [ledger]);
  const isDraft = ledger && String(ledger.status) === "draft";
  const canEditLedger = Boolean(ledger && isDraft);
  const canRecordPayment = Boolean(ledger && !isDraft && String(ledger.payment_status) !== "paid");

  useEffect(() => {
    setLineInputs([newInputLine()]);
  }, [ledger?.id]);

  useEffect(() => {
    setDealer(String(ledger?.dealer_name ?? "Dealer"));
    setDealerPhone(String(ledger?.dealer_phone ?? ""));
    setPaymentMethod(String(ledger?.payment_method ?? ""));
    setPaymentStatus(String(ledger?.payment_status ?? "installments"));
    setPaidAmount(
      ledger && String(ledger.status) !== "draft"
        ? ""
        : ledger?.paid_amount != null && Number(ledger.paid_amount) > 0
          ? String(ledger.paid_amount)
          : ""
    );
    setPaymentNote(String(ledger?.note ?? ""));
    const rows = {};
    for (const item of Array.isArray(ledger?.items) ? ledger.items : []) {
      rows[String(item.id)] = {
        itemId: String(item.item_id ?? ""),
        subledgerId: item.subledger_id != null ? String(item.subledger_id) : "",
        totalQtyKg: gramsToKgInput(/** @type {string | number} */ (item.total_weight_grams ?? 0)),
        cartons: String(item.quantity ?? ""),
        totalPrice: String(item.total_price ?? ""),
      };
    }
    setEditRows(rows);
  }, [ledger]);

  const totals = ledgerItems.reduce(
    (acc, item) => {
      acc.items += 1;
      acc.cartons += Number(item.quantity ?? 0);
      acc.grams += Number(item.total_weight_grams ?? 0);
      acc.price += Number(item.total_price ?? 0);
      return acc;
    },
    { items: 0, cartons: 0, grams: 0, price: 0 }
  );

  function buildPayload(line) {
    const itemId = Number(line.itemId);
    const totalGrams = kgToGrams(line.totalQtyKg);
    const rawCartons = String(line.cartons ?? "").trim();
    const cartons = rawCartons ? parseInt(rawCartons, 10) : 0;
    const totalPrice = numberValue(line.totalPrice);
    if (!itemId || totalGrams == null) {
      toast.error("Select product and enter total quantity (kg)");
      return null;
    }
    if (!Number.isFinite(cartons) || cartons < 0) {
      toast.error("Enter a valid bags/cartons count or leave it empty");
      return null;
    }
    if (totalPrice == null || totalPrice <= 0) {
      toast.error("Enter total line price");
      return null;
    }
    return {
      item_id: itemId,
      subledger_id: line.subledgerId ? Number(line.subledgerId) : null,
      quantity: cartons,
      total_weight_grams: totalGrams,
      total_price: String(totalPrice),
    };
  }

  function detailsPayload() {
    const dealerName = dealer.trim();
    if (!dealerName) {
      toast.error("Enter dealer name");
      return null;
    }
    return {
      dealer_name: dealerName,
      dealer_phone: dealerPhone.trim() || null,
      payment_method: paymentMethod.trim() || null,
      payment_status: paymentStatus,
      paid_amount: paidAmount.trim() ? paidAmount.trim() : null,
      payment_note: paymentNote.trim() || null,
    };
  }

  async function startEntry() {
    await onStartLedger({
      dealer_name: "Dealer",
      dealer_phone: null,
      payment_method: null,
      payment_status: "installments",
      paid_amount: null,
      payment_note: null,
    });
  }

  async function saveDetails() {
    const payload = detailsPayload();
    if (!payload) return;
    await onUpdateLedger(payload);
  }

  async function finalizeEntry() {
    const payload = detailsPayload();
    if (!payload) return;
    await onUpdateLedger(payload);
    await onFinalize();
  }

  function updateInputLine(id, key, value) {
    setLineInputs((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;
        if (key === "itemId") return { ...row, itemId: value, subledgerId: "" };
        return { ...row, [key]: value };
      })
    );
  }

  function removeInputLine(id) {
    setLineInputs((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  }

  async function addLinesToLedger() {
    if (!ledger) {
      toast.error("Start a dealer sale entry first");
      return;
    }
    const payloads = [];
    for (const row of lineInputs) {
      const payload = buildPayload(row);
      if (!payload) return;
      payloads.push(payload);
    }
    await onAddItems(payloads);
    setLineInputs([newInputLine()]);
  }

  function updateEditRow(id, key, value) {
    setEditRows((state) => {
      const row = state[id] ?? newLine();
      if (key === "itemId") return { ...state, [id]: { ...row, itemId: value, subledgerId: "" } };
      return { ...state, [id]: { ...row, [key]: value } };
    });
  }

  async function saveLine(item) {
    const payload = buildPayload(editRows[String(item.id)] ?? newLine());
    if (!payload) return;
    await onUpdateItem(Number(item.id), payload);
  }

  async function addPayment() {
    if (!ledger?.id) return;
    const amount = numberValue(paidAmount);
    if (amount == null || amount <= 0) {
      toast.error("Enter payment amount");
      return;
    }
    await onAddPayment(Number(ledger.id), {
      amount: String(amount),
      payment_method: paymentMethod.trim() || null,
      note: paymentNote.trim() || null,
    });
    setPaidAmount("");
    setPaymentNote("");
  }

  return (
    <ModeScaffold
      title="Dealer sale ledger"
      description={ledger ? `Entry #${ledger.id} - ${String(ledger.status)}` : "No dealer sale selected"}
      busy={busy}
      buttonLabel="New dealer sale"
      onStart={startEntry}
      emptyText="Start a dealer sale ledger, add items loaded from shop stock, then finalize and collect payment later in any installments."
      record={ledger}
      summary={{
        items: String(totals.items),
        secondaryCountLabel: "Load units (optional)",
        secondaryCountValue: totals.cartons > 0 ? String(totals.cartons) : "—",
        quantity: formatWeight(totals.grams, "kg"),
        total: money(totals.price),
      }}
      detailsTitle="Dealer details"
      status={ledger?.status}
      canEditRecord={canEditLedger}
      canRecordPayment={canRecordPayment}
      nameLabel="Dealer"
      nameValue={dealer}
      onNameChange={setDealer}
      extraNameLabel="Phone"
      extraNameValue={dealerPhone}
      onExtraNameChange={setDealerPhone}
      paymentMethod={paymentMethod}
      onPaymentMethodChange={setPaymentMethod}
      paymentStatus={paymentStatus}
      onPaymentStatusChange={setPaymentStatus}
      paidAmount={paidAmount}
      onPaidAmountChange={setPaidAmount}
      paymentNote={paymentNote}
      onPaymentNoteChange={setPaymentNote}
      saveLabel="Save dealer"
      onSaveDetails={saveDetails}
      addPaymentLabel="Add installment"
      onAddPayment={addPayment}
      canAddItems={canEditLedger}
      addItemsTitle="Add load items"
      addItemsPrimaryLabel="Add to ledger"
      lineInputs={lineInputs}
      updateInputLine={updateInputLine}
      removeInputLine={removeInputLine}
      onAddInputRow={() => setLineInputs((rows) => [...rows, newInputLine()])}
      onAddLines={addLinesToLedger}
      items={items}
      subledgersByItemId={subledgersByItemId}
      itemLabel="Product"
      quantityLabel="Total qty loaded (kg)"
      countLabel="Bags/Cartons (optional)"
      totalLabel="Total sale price"
      rows={ledgerItems}
      editRows={editRows}
      updateEditRow={updateEditRow}
      saveRow={saveLine}
      deleteRow={(id) => onDeleteItem(Number(id))}
      itemNameById={itemNameById}
      subledgerById={subledgerById}
      footerText={ledger ? `Received ${money(ledger.paid_amount)} / left ${money(ledger.remaining_amount)}` : ""}
      rowTotal={(item) => money(item.total_price)}
      rowTotalDisplayLabel="Line total"
      totalDisplay={(item) => money(item.total_price)}
      countDisplay={(item) => (Number(item.quantity ?? 0) > 0 ? String(item.quantity) : "—")}
      quantityDisplay={(item) => formatWeight(Number(item.total_weight_grams ?? 0), "kg")}
      canFinalize={isDraft}
      finalizeLabel="Finalize ledger"
      onFinalize={finalizeEntry}
    />
  );
}

function ModeScaffold({
  title,
  description,
  busy,
  buttonLabel,
  onStart,
  emptyText,
  record,
  summary,
  detailsTitle,
  status,
  canEditRecord,
  canRecordPayment,
  nameLabel,
  nameValue,
  onNameChange,
  extraNameLabel,
  extraNameValue,
  onExtraNameChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentStatus,
  onPaymentStatusChange,
  paidAmount,
  onPaidAmountChange,
  paymentNote,
  onPaymentNoteChange,
  saveLabel,
  onSaveDetails,
  addPaymentLabel,
  onAddPayment,
  canAddItems,
  addItemsTitle,
  addItemsPrimaryLabel,
  lineInputs,
  updateInputLine,
  removeInputLine,
  onAddInputRow,
  onAddLines,
  items,
  subledgersByItemId,
  itemLabel,
  quantityLabel,
  countLabel,
  totalLabel,
  rows,
  editRows,
  updateEditRow,
  saveRow,
  deleteRow,
  itemNameById,
  subledgerById,
  footerText,
  rowTotal,
  totalDisplay,
  countDisplay,
  quantityDisplay,
  canFinalize,
  finalizeLabel,
  onFinalize,
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="secondary" onClick={onStart} disabled={busy} className="shrink-0">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {buttonLabel}
        </Button>
      </div>

      {!record && (
        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}

      {record && (
        <>
          <div className="grid gap-2 rounded-md border border-border/80 bg-muted/25 p-3 text-sm sm:grid-cols-4">
            <Summary label="Items" value={summary.items} />
            <Summary label={summary.secondaryCountLabel} value={summary.secondaryCountValue} />
            <Summary label="Quantity" value={summary.quantity} />
            <Summary label="Total" value={summary.total} />
          </div>

          <div className="space-y-4 rounded-md border border-border/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{detailsTitle}</p>
              <Badge variant={String(status) === "completed" ? "info" : "default"}>{String(status)}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label={nameLabel}>
                <Input value={nameValue} onChange={(e) => onNameChange(e.target.value)} disabled={busy || !canEditRecord} />
              </Field>
              {extraNameLabel && onExtraNameChange && (
                <Field label={extraNameLabel}>
                  <Input value={extraNameValue ?? ""} onChange={(e) => onExtraNameChange(e.target.value)} disabled={busy || !canEditRecord} />
                </Field>
              )}
              <Field label="Payment method">
                <Input
                  value={paymentMethod}
                  onChange={(e) => onPaymentMethodChange(e.target.value)}
                  placeholder="Cash, bank transfer, cheque..."
                  disabled={busy || (!canEditRecord && !canRecordPayment)}
                />
              </Field>
              <Field label="Status">
                <Select value={paymentStatus} onValueChange={onPaymentStatusChange} disabled={busy || !canEditRecord}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Fully paid</SelectItem>
                    <SelectItem value="installments">Installments</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Paid now">
                <Input
                  value={paidAmount}
                  onChange={(e) => onPaidAmountChange(e.target.value)}
                  inputMode="decimal"
                  disabled={busy || (!canEditRecord && !canRecordPayment)}
                />
              </Field>
            </div>
            <Field label="Payment note">
              <Input value={paymentNote} onChange={(e) => onPaymentNoteChange(e.target.value)} disabled={busy || (!canEditRecord && !canRecordPayment)} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {canEditRecord && (
                <Button type="button" variant="outline" onClick={onSaveDetails} disabled={busy}>
                  <Save className="size-4" />
                  {saveLabel}
                </Button>
              )}
              {canRecordPayment && (
                <Button type="button" onClick={onAddPayment} disabled={busy}>
                  <Check className="size-4" />
                  {addPaymentLabel}
                </Button>
              )}
            </div>
          </div>

          {canAddItems && (
            <div className="space-y-3 rounded-md border border-border/80 p-3">
              <p className="font-medium">{addItemsTitle}</p>
              {lineInputs.map((line, index) => (
                <div
                  key={line.id}
                  className="grid gap-3 rounded-md border border-border/80 p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,120px)_minmax(0,120px)_minmax(0,140px)_auto] xl:items-end"
                >
                  <ProductSelect
                    label={itemLabel}
                    value={inputValue(line.itemId)}
                    items={items}
                    onChange={(value) => updateInputLine(line.id, "itemId", value)}
                    disabled={busy}
                  />
                  <VariantSelect
                    label="Variant"
                    value={inputValue(line.subledgerId)}
                    itemId={inputValue(line.itemId)}
                    subledgersByItemId={subledgersByItemId}
                    onChange={(value) => updateInputLine(line.id, "subledgerId", value)}
                    disabled={busy}
                  />
                  <Field label={quantityLabel}>
                    <Input
                      value={inputValue(line.totalQtyKg)}
                      onChange={(e) => updateInputLine(line.id, "totalQtyKg", e.target.value)}
                      type="number"
                      min="0.001"
                      step="0.001"
                      disabled={busy}
                    />
                  </Field>
                  <Field label={countLabel}>
                    <Input
                      value={inputValue(line.cartons)}
                      onChange={(e) => updateInputLine(line.id, "cartons", e.target.value)}
                      type="number"
                      min="1"
                      step="1"
                      disabled={busy}
                    />
                  </Field>
                  <Field label={totalLabel}>
                    <Input
                      value={inputValue(line.totalPrice)}
                      onChange={(e) => updateInputLine(line.id, "totalPrice", e.target.value)}
                      inputMode="decimal"
                      disabled={busy}
                    />
                  </Field>
                  <div className="flex items-end justify-end pb-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeInputLine(line.id)}
                      disabled={busy || lineInputs.length === 1}
                      aria-label={`Remove line ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={onAddInputRow} disabled={busy}>
                  <Plus className="size-4" />
                  Add item
                </Button>
                <Button type="button" onClick={onAddLines} disabled={busy}>
                  <Plus className="size-4" />
                  {addItemsPrimaryLabel}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">Items in record</p>
              <p className="text-sm text-muted-foreground">{footerText}</p>
            </div>
            {rows.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                No items added yet.
              </div>
            ) : (
              <div className="max-h-90 overflow-auto rounded-md border border-border/80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      {canAddItems && <TableHead>Variant</TableHead>}
                      <TableHead>Total qty (kg)</TableHead>
                      <TableHead>{countLabel}</TableHead>
                      <TableHead className="min-w-40">{totalLabel}</TableHead>
                      <TableHead className="text-right">Line total</TableHead>
                      {canAddItems && <TableHead className="w-24 text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((item) => {
                      const row = editRows[String(item.id)] ?? newLine();
                      const subledger = subledgerById.get(Number(item.subledger_id));
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="min-w-48 font-medium">
                            {canAddItems ? (
                              <ProductSelect
                                value={inputValue(row.itemId)}
                                items={items}
                                onChange={(value) => updateEditRow(String(item.id), "itemId", value)}
                                disabled={busy}
                              />
                            ) : (
                              <>
                                {itemNameById.get(Number(item.item_id)) ?? `Item #${item.item_id}`}
                                {subledger && <span className="block text-xs font-normal text-muted-foreground">{getItemName(/** @type {Record<string, string>} */ (subledger.name))}</span>}
                              </>
                            )}
                          </TableCell>
                          {canAddItems && (
                            <TableCell className="min-w-44">
                              <VariantSelect
                                value={inputValue(row.subledgerId)}
                                itemId={inputValue(row.itemId)}
                                subledgersByItemId={subledgersByItemId}
                                onChange={(value) => updateEditRow(String(item.id), "subledgerId", value)}
                                disabled={busy}
                              />
                            </TableCell>
                          )}
                          <TableCell className="w-36">
                            {canAddItems ? (
                              <Input value={inputValue(row.totalQtyKg)} onChange={(e) => updateEditRow(String(item.id), "totalQtyKg", e.target.value)} type="number" min="0.001" step="0.001" />
                            ) : (
                              quantityDisplay(item)
                            )}
                          </TableCell>
                          <TableCell className="w-28">
                            {canAddItems ? (
                              <Input value={inputValue(row.cartons)} onChange={(e) => updateEditRow(String(item.id), "cartons", e.target.value)} type="number" min="1" step="1" />
                            ) : (
                              countDisplay(item)
                            )}
                          </TableCell>
                          <TableCell className="min-w-44">
                            {canAddItems ? (
                              <Input value={inputValue(row.totalPrice)} onChange={(e) => updateEditRow(String(item.id), "totalPrice", e.target.value)} inputMode="decimal" />
                            ) : (
                              totalDisplay(item)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{rowTotal(item)}</TableCell>
                          {canAddItems && (
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                <Button type="button" variant="outline" size="iconSm" onClick={() => saveRow(item)} disabled={busy} aria-label="Save item">
                                  <Check className="size-4" />
                                </Button>
                                <Button type="button" variant="outline" size="iconSm" onClick={() => deleteRow(item.id)} disabled={busy} aria-label="Remove item">
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
              </div>
            )}
          </div>

          {canFinalize && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="accent" onClick={onFinalize} disabled={busy || rows.length === 0}>
                <PackagePlus className="size-4" />
                {finalizeLabel}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** @param {{ label: string; children: React.ReactNode }} props */
function Field({ label, children }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label className="block truncate">{label}</Label>
      {children}
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

/** @param {{ label?: string; value: string; items: Array<Record<string, unknown>>; onChange: (value: string) => void; disabled?: boolean }} props */
function ProductSelect({ label, value, items, onChange, disabled }) {
  const control = (
    <Select value={inputValue(value)} onValueChange={onChange} disabled={disabled}>
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
  );
  return label ? <Field label={label}>{control}</Field> : control;
}

/**
 * @param {{
 *   label?: string;
 *   value: string;
 *   itemId: string;
 *   subledgersByItemId: Map<number, Array<Record<string, unknown>>>;
 *   onChange: (value: string) => void;
 *   disabled?: boolean;
 * }} props
 */
function VariantSelect({ label, value, itemId, subledgersByItemId, onChange, disabled }) {
  const control = (
    <Select value={value || "standalone"} onValueChange={(next) => onChange(next === "standalone" ? "" : next)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Standalone" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="standalone">Standalone</SelectItem>
        {(subledgersByItemId.get(Number(itemId)) ?? [])
          .filter((subledger) => subledger.is_active !== false)
          .map((subledger) => (
            <SelectItem key={subledger.id} value={String(subledger.id)}>
              {getItemName(/** @type {Record<string, string>} */ (subledger.name))}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
  return label ? <Field label={label}>{control}</Field> : control;
}
