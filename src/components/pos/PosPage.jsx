"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createExpense,
  createLedger,
  addSaleItem,
  addLedgerItemsBatch,
  addLedgerPayment,
  addPurchaseItemsBatch,
  addPurchasePayment,
  createPurchase,
  createSale,
  deleteExpense,
  deleteLedger,
  deleteLedgerItem,
  deletePurchase,
  deletePurchaseItem,
  deleteSale,
  deleteSaleItem,
  finalizeExpense,
  finalizeLedger,
  getExpense,
  getLedger,
  finalizePurchase,
  finalizeSale,
  getPurchase,
  getSale,
  listLedger,
  listExpenses,
  listItems,
  listPurchases,
  listSales,
  listSubledgers,
  updateLedger,
  updateLedgerItem,
  updateExpense,
  updatePurchase,
  updatePurchaseItem,
  updateSaleItem,
  updateSaleDiscount,
} from "@/api";
import { formatWeight, money } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { Badge } from "@/components/ui/badge";
import { BillCard } from "@/components/pos/BillCard";
import { ExpenseEntryCard } from "@/components/pos/ExpenseEntryCard";
import { SupplierPurchaseCard } from "@/components/pos/SupplierPurchaseCard";
import { ApiError } from "@/api/client";

export function PosPage() {
  const wid = useWorkspaceStore((s) => s.activeWorkspaceId);
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [subledgers, setSubledgers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [sale, setSale] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [purchase, setPurchase] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [ledger, setLedger] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [expense, setExpense] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [stockEntryMode, setStockEntryMode] = useState(/** @type {"purchase" | "ledger"} */ ("purchase"));
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [purchases, setPurchases] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [ledgers, setLedgers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [expenses, setExpenses] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const isAdmin = user?.role === "Admin";

  const loadItems = useCallback(async () => {
    if (wid == null) return;
    try {
      const [list, variants] = await Promise.all([listItems(wid, null), listSubledgers(wid)]);
      setItems(Array.isArray(list) ? list : []);
      setSubledgers(Array.isArray(variants) ? variants : []);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    }
  }, [wid]);

  const loadRecent = useCallback(async () => {
    if (wid == null) return;
    try {
      const [list, purchaseList, ledgerList, expenseList] = await Promise.all([
        listSales(wid),
        listPurchases(wid),
        isAdmin ? listLedger(wid) : Promise.resolve([]),
        isAdmin ? listExpenses(wid) : Promise.resolve([]),
      ]);
      const arr = Array.isArray(list) ? list : [];
      const purchaseArr = Array.isArray(purchaseList) ? purchaseList : [];
      const ledgerArr = Array.isArray(ledgerList) ? ledgerList : [];
      const expenseArr = Array.isArray(expenseList) ? expenseList : [];
      setRecent(arr.slice(0, 12));
      setPurchases(purchaseArr.slice(0, 12));
      setLedgers(ledgerArr.slice(0, 12));
      setExpenses(expenseArr.slice(0, 12));
    } catch {
      /* ignore */
    }
  }, [isAdmin, wid]);

  useEffect(() => {
    loadItems();
    loadRecent();
  }, [loadItems, loadRecent]);

  async function startSale() {
    if (wid == null) return;
    setBusy(true);
    try {
      const s = await createSale(wid, { discount_amount: "0" });
      setSale(s);
      loadRecent();
      toast.message("Draft bill started");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Array<{ item_id: number; subledger_id?: number | null; quantity_grams: number; unit_price: string }>} payloads */
  async function addLines(payloads) {
    if (wid == null || !sale?.id) {
      toast.error("Start a bill first");
      return;
    }
    setBusy(true);
    try {
      let updated = sale;
      for (const payload of payloads) {
        updated = await addSaleItem(wid, Number(sale.id), payload);
      }
      setSale(updated);
      loadRecent();
      toast.success(payloads.length === 1 ? "Line added" : "Lines added");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /**
   * @param {number} saleItemId
   * @param {{ item_id: number; subledger_id?: number | null; quantity_grams: number; unit_price: string }} payload
   */
  async function editLine(saleItemId, payload) {
    if (wid == null || !sale?.id) return;
    setBusy(true);
    try {
      const s = await updateSaleItem(wid, Number(sale.id), saleItemId, payload);
      setSale(s);
      loadRecent();
      toast.success("Line updated");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} saleItemId */
  async function removeLine(saleItemId) {
    if (wid == null || !sale?.id) return;
    setBusy(true);
    try {
      const s = await deleteSaleItem(wid, Number(sale.id), saleItemId);
      setSale(s);
      loadRecent();
      toast.success("Line removed");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {string} discount */
  async function applyDiscount(discount) {
    if (wid == null || !sale?.id) return;
    setBusy(true);
    try {
      const s = await updateSaleDiscount(wid, Number(sale.id), {
        discount_amount: String(discount || "0"),
      });
      setSale(s);
      loadRecent();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (wid == null || !sale?.id) return;
    if (String(sale.status) === "completed") {
      toast.error("Already completed");
      return;
    }
    setBusy(true);
    try {
      const s = await finalizeSale(wid, Number(sale.id));
      setSale(s);
      toast.success("Bill completed");
      loadRecent();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Record<string, unknown>} payload */
  async function startPurchase(payload) {
    if (wid == null) return;
    setBusy(true);
    try {
      const p = await createPurchase(wid, payload);
      setPurchase(p);
      setStockEntryMode("purchase");
      toast.message("Draft supplier slip started");
      await loadRecent();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Record<string, unknown>} payload */
  async function editPurchaseDetails(payload) {
    if (wid == null || !purchase?.id) return;
    setBusy(true);
    try {
      const p = await updatePurchase(wid, Number(purchase.id), payload);
      setPurchase(p);
      await loadRecent();
      toast.success("Slip details saved");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Array<Record<string, unknown>>} payloads */
  async function addPurchaseLines(payloads) {
    if (wid == null || !purchase?.id) {
      toast.error("Start a supplier slip first");
      return;
    }
    setBusy(true);
    try {
      const p = await addPurchaseItemsBatch(wid, Number(purchase.id), { items: payloads });
      setPurchase(p);
      await loadRecent();
      toast.success(payloads.length === 1 ? "Item added to slip" : "Items added to slip");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} purchaseItemId @param {Record<string, unknown>} payload */
  async function editPurchaseLine(purchaseItemId, payload) {
    if (wid == null || !purchase?.id) return;
    setBusy(true);
    try {
      const p = await updatePurchaseItem(wid, Number(purchase.id), purchaseItemId, payload);
      setPurchase(p);
      await loadRecent();
      toast.success("Slip item updated");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} purchaseItemId */
  async function removePurchaseLine(purchaseItemId) {
    if (wid == null || !purchase?.id) return;
    setBusy(true);
    try {
      const p = await deletePurchaseItem(wid, Number(purchase.id), purchaseItemId);
      setPurchase(p);
      await loadRecent();
      toast.success("Slip item removed");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function completePurchaseSlip() {
    if (wid == null || !purchase?.id) return;
    setBusy(true);
    try {
      const p = await finalizePurchase(wid, Number(purchase.id));
      setPurchase(p);
      toast.success("Supplier slip finalized");
      await loadRecent();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} purchaseId @param {{ amount: string; payment_method?: string | null; note?: string | null }} payload */
  async function postPurchasePayment(purchaseId, payload) {
    if (wid == null) return;
    setBusy(true);
    try {
      const p = await addPurchasePayment(wid, purchaseId, payload);
      if (Number(purchase?.id) === purchaseId) setPurchase(p);
      toast.success("Payment recorded");
      await loadRecent();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} purchaseId */
  async function openPurchase(purchaseId) {
    if (wid == null) return;
    setBusy(true);
    try {
      const p = await getPurchase(wid, purchaseId);
      setPurchase(p);
      setStockEntryMode("purchase");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} purchaseId */
  async function removeDraftPurchase(purchaseId) {
    if (wid == null) return;
    setBusy(true);
    try {
      await deletePurchase(wid, purchaseId);
      if (Number(purchase?.id) === purchaseId) setPurchase(null);
      await loadRecent();
      toast.success("Supplier slip deleted");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Record<string, unknown>} payload */
  async function startLedgerEntry(payload) {
    if (wid == null) return;
    setBusy(true);
    try {
      const nextLedger = await createLedger(wid, payload);
      setLedger(nextLedger);
      setStockEntryMode("ledger");
      toast.message("Draft dealer sale started");
      await loadRecent();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Record<string, unknown>} payload */
  async function editLedgerDetails(payload) {
    if (wid == null || !ledger?.id) return;
    setBusy(true);
    try {
      const nextLedger = await updateLedger(wid, Number(ledger.id), payload);
      setLedger(nextLedger);
      await loadRecent();
      toast.success("Dealer details saved");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Array<Record<string, unknown>>} payloads */
  async function addLedgerLines(payloads) {
    if (wid == null || !ledger?.id) {
      toast.error("Start a dealer sale first");
      return;
    }
    setBusy(true);
    try {
      const nextLedger = await addLedgerItemsBatch(wid, Number(ledger.id), { items: payloads });
      setLedger(nextLedger);
      await loadRecent();
      toast.success(payloads.length === 1 ? "Item added to ledger" : "Items added to ledger");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} ledgerItemId @param {Record<string, unknown>} payload */
  async function editLedgerLine(ledgerItemId, payload) {
    if (wid == null || !ledger?.id) return;
    setBusy(true);
    try {
      const nextLedger = await updateLedgerItem(wid, Number(ledger.id), ledgerItemId, payload);
      setLedger(nextLedger);
      await loadRecent();
      toast.success("Ledger item updated");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} ledgerItemId */
  async function removeLedgerLine(ledgerItemId) {
    if (wid == null || !ledger?.id) return;
    setBusy(true);
    try {
      const nextLedger = await deleteLedgerItem(wid, Number(ledger.id), ledgerItemId);
      setLedger(nextLedger);
      await loadRecent();
      toast.success("Ledger item removed");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function completeLedgerEntry() {
    if (wid == null || !ledger?.id) return;
    setBusy(true);
    try {
      const nextLedger = await finalizeLedger(wid, Number(ledger.id));
      setLedger(nextLedger);
      toast.success("Dealer sale finalized");
      await loadRecent();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} ledgerId @param {{ amount: string; payment_method?: string | null; note?: string | null }} payload */
  async function postLedgerPayment(ledgerId, payload) {
    if (wid == null) return;
    setBusy(true);
    try {
      const nextLedger = await addLedgerPayment(wid, ledgerId, payload);
      if (Number(ledger?.id) === ledgerId) setLedger(nextLedger);
      toast.success("Installment recorded");
      await loadRecent();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} ledgerId */
  async function openLedgerEntry(ledgerId) {
    if (wid == null) return;
    setBusy(true);
    try {
      const nextLedger = await getLedger(wid, ledgerId);
      setLedger(nextLedger);
      setStockEntryMode("ledger");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} ledgerId */
  async function removeDraftLedgerEntry(ledgerId) {
    if (wid == null) return;
    setBusy(true);
    try {
      await deleteLedger(wid, ledgerId);
      if (Number(ledger?.id) === ledgerId) setLedger(null);
      await loadRecent();
      toast.success("Dealer sale deleted");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Record<string, unknown>} payload */
  async function startExpenseEntry(payload) {
    if (wid == null) return;
    setBusy(true);
    try {
      const nextExpense = await createExpense(wid, payload);
      setExpense(nextExpense);
      await loadRecent();
      toast.message("Draft expense started");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {Record<string, unknown>} payload */
  async function editExpenseEntry(payload) {
    if (wid == null || !expense?.id) return;
    setBusy(true);
    try {
      const nextExpense = await updateExpense(wid, Number(expense.id), payload);
      setExpense(nextExpense);
      await loadRecent();
      toast.success("Expense saved");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function completeExpenseEntry() {
    if (wid == null || !expense?.id) return;
    setBusy(true);
    try {
      const nextExpense = await finalizeExpense(wid, Number(expense.id));
      setExpense(nextExpense);
      await loadRecent();
      toast.success("Expense finalized");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} expenseId */
  async function openExpense(expenseId) {
    if (wid == null) return;
    setBusy(true);
    try {
      const nextExpense = await getExpense(wid, expenseId);
      setExpense(nextExpense);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} expenseId */
  async function removeExpenseEntry(expenseId) {
    if (wid == null) return;
    setBusy(true);
    try {
      await deleteExpense(wid, expenseId);
      if (Number(expense?.id) === expenseId) setExpense(null);
      await loadRecent();
      toast.success("Expense deleted");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} saleId */
  async function openSale(saleId) {
    if (wid == null) return;
    setBusy(true);
    try {
      const s = await getSale(wid, saleId);
      setSale(s);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  /** @param {number} saleId */
  async function removeDraftSale(saleId) {
    if (wid == null) return;
    setBusy(true);
    try {
      await deleteSale(wid, saleId);
      if (Number(sale?.id) === saleId) setSale(null);
      await loadRecent();
      toast.success("Bill deleted");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (wid == null) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Select a workspace in the header to use POS.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_390px] 2xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="min-w-0 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold [font-family:var(--font-outfit),system-ui,sans-serif]">
            Point of sale
          </h1>
          <p className="text-sm text-muted-foreground">Draft a bill, add lines, then finalize to post stock from shop.</p>
        </div>
        <BillCard
          sale={sale}
          items={items}
          subledgers={subledgers}
          busy={busy}
          canEditCompleted={isAdmin}
          onStartSale={startSale}
          onAddItems={addLines}
          onUpdateItem={editLine}
          onDeleteItem={removeLine}
          onApplyDiscount={applyDiscount}
          onFinalize={pay}
        />
        <SupplierPurchaseCard
          mode={stockEntryMode}
          onModeChange={setStockEntryMode}
          purchase={purchase}
          ledger={ledger}
          items={items}
          subledgers={subledgers}
          busy={busy}
          canEditCompleted={isAdmin}
          onStartPurchase={startPurchase}
          onUpdatePurchase={editPurchaseDetails}
          onAddItems={addPurchaseLines}
          onUpdateItem={editPurchaseLine}
          onDeleteItem={removePurchaseLine}
          onFinalize={completePurchaseSlip}
          onAddPayment={postPurchasePayment}
          onStartLedger={startLedgerEntry}
          onUpdateLedger={editLedgerDetails}
          onAddLedgerItems={addLedgerLines}
          onUpdateLedgerItem={editLedgerLine}
          onDeleteLedgerItem={removeLedgerLine}
          onFinalizeLedger={completeLedgerEntry}
          onAddLedgerPayment={postLedgerPayment}
        />
        {isAdmin && (
          <ExpenseEntryCard
            expense={expense}
            busy={busy}
            canEditCompleted={isAdmin}
            onStartExpense={startExpenseEntry}
            onUpdateExpense={editExpenseEntry}
            onFinalize={completeExpenseEntry}
          />
        )}
      </div>
      <div className="min-w-0 space-y-4 xl:sticky xl:top-20 xl:self-start">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>{isAdmin ? "Open any bill; admins can also edit or delete completed bills" : "Open any bill; only drafts can be changed or deleted"}</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[40vh] space-y-2 overflow-y-auto pr-3 text-sm">
          {recent.length === 0 && <p className="text-muted-foreground">No bills yet.</p>}
          {recent.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => openSale(Number(s.id))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openSale(Number(s.id));
              }}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-md border border-border/80 px-2 py-2 text-left hover:bg-muted/60"
            >
              <span className="font-medium">#{s.id}</span>
              <Badge className="min-w-0 justify-center truncate" variant={String(s.status) === "completed" ? "info" : "default"}>
                {String(s.status)}
              </Badge>
              <span className="font-medium tabular-nums">{money(s.total_amount)}</span>
              {String(s.status) === "draft" || isAdmin ? (
                <Button
                  type="button"
                  variant="outline"
                  size="iconSm"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDraftSale(Number(s.id));
                  }}
                  aria-label={`Delete bill ${s.id}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : (
                <span className="h-8 w-8" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Supplier slips</CardTitle>
          <CardDescription>{isAdmin ? "Open a slip; admins can also edit or delete completed slips" : "Open a slip; drafts can be changed or deleted"}</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[40vh] space-y-2 overflow-y-auto pr-3 text-sm">
          {purchases.length === 0 && <p className="text-muted-foreground">No supplier slips yet.</p>}
          {purchases.map((p) => {
            const purchaseItems = Array.isArray(p.items) ? p.items : [];
            const grams = purchaseItems.reduce((sum, item) => sum + Number(item.total_weight_grams ?? 0), 0);
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => openPurchase(Number(p.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openPurchase(Number(p.id));
                }}
                className="space-y-2 rounded-md border border-border/80 px-2 py-2 text-left hover:bg-muted/60"
              >
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                  <span className="font-medium">#{p.id}</span>
                  <Badge className="min-w-0 justify-center truncate" variant={String(p.status) === "completed" ? "info" : "default"}>
                    {String(p.status)}
                  </Badge>
                  {String(p.status) === "draft" || isAdmin ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="iconSm"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDraftPurchase(Number(p.id));
                      }}
                      aria-label={`Delete supplier slip ${p.id}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : (
                    <span className="h-8 w-8" />
                  )}
                </div>
                <div className="truncate text-muted-foreground">{String(p.supplier_name)}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{formatWeight(grams, "kg")}</span>
                  <span className="text-right font-medium text-foreground">{money(p.total_amount)}</span>
                  <span>Paid {money(p.paid_amount)}</span>
                  <span className="text-right">Left {money(p.remaining_amount)}</span>
                </div>
                {String(p.payment_status) !== "paid" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPurchase(Number(p.id));
                    }}
                  >
                    Add payment
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      {isAdmin && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Dealer sale ledgers</CardTitle>
            <CardDescription>Track loaded items, outstanding balance, and any later installments from dealers.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[40vh] space-y-2 overflow-y-auto pr-3 text-sm">
            {ledgers.length === 0 && <p className="text-muted-foreground">No dealer sale ledgers yet.</p>}
            {ledgers.map((entry) => {
              const ledgerItems = Array.isArray(entry.items) ? entry.items : [];
              const grams = ledgerItems.reduce((sum, item) => sum + Number(item.total_weight_grams ?? 0), 0);
              return (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openLedgerEntry(Number(entry.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openLedgerEntry(Number(entry.id));
                  }}
                  className="space-y-2 rounded-md border border-border/80 px-2 py-2 text-left hover:bg-muted/60"
                >
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                    <span className="font-medium">#{entry.id}</span>
                    <Badge className="min-w-0 justify-center truncate" variant={String(entry.status) === "completed" ? "info" : "default"}>
                      {String(entry.status)}
                    </Badge>
                    {String(entry.status) === "draft" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="iconSm"
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDraftLedgerEntry(Number(entry.id));
                        }}
                        aria-label={`Delete dealer ledger ${entry.id}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <span className="h-8 w-8" />
                    )}
                  </div>
                  <div className="truncate text-muted-foreground">{String(entry.dealer_name)}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>{formatWeight(grams, "kg")}</span>
                    <span className="text-right font-medium text-foreground">{money(entry.total_amount)}</span>
                    <span>Received {money(entry.paid_amount)}</span>
                    <span className="text-right">Left {money(entry.remaining_amount)}</span>
                  </div>
                  {String(entry.payment_status) !== "paid" && String(entry.status) === "completed" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLedgerEntry(Number(entry.id));
                      }}
                    >
                      Add installment
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
      {isAdmin && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Expense entries</CardTitle>
            <CardDescription>Track electricity bills, wages, rent, and other operating costs.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[40vh] space-y-2 overflow-y-auto pr-3 text-sm">
            {expenses.length === 0 && <p className="text-muted-foreground">No expense entries yet.</p>}
            {expenses.map((entry) => (
              <div
                key={entry.id}
                role="button"
                tabIndex={0}
                onClick={() => openExpense(Number(entry.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openExpense(Number(entry.id));
                }}
                className="space-y-2 rounded-md border border-border/80 px-2 py-2 text-left hover:bg-muted/60"
              >
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                  <span className="font-medium">#{entry.id}</span>
                  <Badge className="min-w-0 justify-center truncate" variant={String(entry.status) === "completed" ? "info" : "default"}>
                    {String(entry.status)}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="iconSm"
                    disabled={busy}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExpenseEntry(Number(entry.id));
                    }}
                    aria-label={`Delete expense ${entry.id}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="truncate font-medium">{String(entry.title)}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="truncate capitalize">{String(entry.category).replaceAll("_", " ")}</span>
                  <span className="text-right font-medium text-foreground">{money(entry.amount)}</span>
                  <span>{String(entry.expense_date)}</span>
                  <span className="truncate text-right">{String(entry.payment_method || "No method")}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
