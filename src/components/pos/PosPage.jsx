"use client";

import { useCallback, useEffect, useState } from "react";
import { HandCoins, PackagePlus, Receipt, Trash2, Wallet } from "lucide-react";
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
  listEmployees,
  listExpenses,
  listItems,
  listPurchases,
  listSales,
  listStock,
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
import { Card, CardContent } from "@/components/common/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillCard } from "@/components/pos/BillCard";
import { ExpenseEntryCard } from "@/components/pos/ExpenseEntryCard";
import { SupplierPurchaseCard } from "@/components/pos/SupplierPurchaseCard";
import { ApiError } from "@/api/client";

export function PosPage() {
  const wid = useWorkspaceStore((s) => s.activeWorkspaceId);
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [subledgers, setSubledgers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [shopStock, setShopStock] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [warehouseStock, setWarehouseStock] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [sale, setSale] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [purchase, setPurchase] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [ledger, setLedger] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [expense, setExpense] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [, setStockEntryMode] = useState(/** @type {"purchase" | "ledger"} */ ("purchase"));
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [purchases, setPurchases] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [ledgers, setLedgers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [expenses, setExpenses] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [employees, setEmployees] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const isAdmin = user?.role === "Admin";

  const loadItems = useCallback(async () => {
    if (wid == null) {
      setItems([]);
      setSubledgers([]);
      setShopStock([]);
      setWarehouseStock([]);
      return;
    }
    try {
      const [list, variants, shopRows, warehouseRows] = await Promise.all([
        listItems(wid, null),
        listSubledgers(wid),
        listStock(wid, "shop"),
        listStock(wid, "warehouse"),
      ]);
      setItems(Array.isArray(list) ? list : []);
      setSubledgers(Array.isArray(variants) ? variants : []);
      setShopStock(Array.isArray(shopRows) ? shopRows : []);
      setWarehouseStock(Array.isArray(warehouseRows) ? warehouseRows : []);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    }
  }, [wid]);

  const loadRecent = useCallback(async () => {
    if (wid == null) return;
    try {
      if (!isAdmin) {
        const list = await listSales(wid);
        setRecent((Array.isArray(list) ? list : []).slice(0, 12));
        setPurchases([]);
        setLedgers([]);
        setExpenses([]);
        setEmployees([]);
        return;
      }
      const [list, purchaseList, ledgerList, expenseList, employeeList] = await Promise.all([
        listSales(wid),
        listPurchases(wid),
        listLedger(wid),
        listExpenses(wid),
        listEmployees(wid),
      ]);
      const arr = Array.isArray(list) ? list : [];
      const purchaseArr = Array.isArray(purchaseList) ? purchaseList : [];
      const ledgerArr = Array.isArray(ledgerList) ? ledgerList : [];
      const expenseArr = Array.isArray(expenseList) ? expenseList : [];
      setRecent(arr.slice(0, 12));
      setPurchases(purchaseArr.slice(0, 12));
      setLedgers(ledgerArr.slice(0, 12));
      setExpenses(expenseArr.slice(0, 12));
      setEmployees(Array.isArray(employeeList) ? employeeList : []);
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
      loadItems();
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
      loadItems();
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
      loadItems();
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
      loadItems();
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
      await loadItems();
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

  const salesTerminal = (
    <BillCard
      sale={sale}
      items={items}
      subledgers={subledgers}
      shopStock={shopStock}
      warehouseStock={warehouseStock}
      busy={busy}
      canEditCompleted={isAdmin}
      onStartSale={startSale}
      onAddItems={addLines}
      onUpdateItem={editLine}
      onDeleteItem={removeLine}
      onApplyDiscount={applyDiscount}
      onFinalize={pay}
    />
  );

  if (!isAdmin) {
    return (
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Sales terminal</p>
            <h1 className="text-2xl font-semibold [font-family:var(--font-outfit),system-ui,sans-serif]">
              Create bills
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Select visible items and variants from the left, then edit quantity and price in the receipt.
            </p>
          </div>
          <div className="w-full text-sm md:w-40">
            <PosStat label="Recent bills" value={recent.length} />
          </div>
        </div>
        {salesTerminal}
      </div>
    );
  }

  const supplierTab = (
    <SupplierPurchaseCard
      mode="purchase"
      onModeChange={setStockEntryMode}
      showModeSwitch={false}
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
  );

  const ledgerTab = (
    <SupplierPurchaseCard
      mode="ledger"
      onModeChange={setStockEntryMode}
      showModeSwitch={false}
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
  );

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">POS workspace</p>
          <h1 className="text-2xl font-semibold [font-family:var(--font-outfit),system-ui,sans-serif]">
            Point of sale
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Sales, supplier stock, dealer credit, and expenses.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 md:min-w-[520px]">
          <PosStat label="Bills" value={recent.length} />
          <PosStat label="Supplier slips" value={purchases.length} />
          {isAdmin && <PosStat label="Dealer ledgers" value={ledgers.length} />}
          {isAdmin && <PosStat label="Expenses" value={expenses.length} />}
        </div>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 justify-stretch gap-1 rounded-lg border border-border bg-muted/70 p-1 md:grid-cols-4">
          <FeatureTab value="sales" icon={Receipt} label="Sales" detail="Bills" />
          <FeatureTab value="supplier" icon={PackagePlus} label="Supplier" detail="Stock in" />
          {isAdmin && <FeatureTab value="ledger" icon={HandCoins} label="Dealer ledger" detail="Credit sale" />}
          {isAdmin && <FeatureTab value="expenses" icon={Wallet} label="Expenses" detail="Admin" />}
        </TabsList>

        <TabsContent value="sales">
          <FeatureWorkspace
            main={salesTerminal}
            side={(
              <BillsHistory
                rows={recent}
                busy={busy}
                isAdmin={isAdmin}
                onOpen={openSale}
                onDelete={removeDraftSale}
              />
            )}
          />
        </TabsContent>

        <TabsContent value="supplier">
          <FeatureWorkspace
            main={supplierTab}
            side={(
              <SupplierHistory
                rows={purchases}
                busy={busy}
                isAdmin={isAdmin}
                onOpen={openPurchase}
                onDelete={removeDraftPurchase}
              />
            )}
          />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="ledger">
            <FeatureWorkspace
              main={ledgerTab}
              side={(
                <LedgerHistory
                  rows={ledgers}
                  busy={busy}
                  onOpen={openLedgerEntry}
                  onDelete={removeDraftLedgerEntry}
                />
              )}
            />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="expenses">
            <FeatureWorkspace
              main={(
                <ExpenseEntryCard
                  expense={expense}
                  employees={employees}
                  busy={busy}
                  canEditCompleted={isAdmin}
                  onStartExpense={startExpenseEntry}
                  onUpdateExpense={editExpenseEntry}
                  onFinalize={completeExpenseEntry}
                />
              )}
              side={(
                <ExpenseHistory
                  rows={expenses}
                  busy={busy}
                  onOpen={openExpense}
                  onDelete={removeExpenseEntry}
                />
              )}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function PosStat({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-elevated px-3 py-2 shadow-sm">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function FeatureTab({ value, icon: Icon, label, detail }) {
  return (
    <TabsTrigger
      value={value}
      className="min-h-14 min-w-0 justify-start gap-3 px-3 text-left data-[state=active]:bg-foreground data-[state=active]:text-background"
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs font-normal opacity-70">{detail}</span>
      </span>
    </TabsTrigger>
  );
}

function FeatureWorkspace({ main, side }) {
  return (
    <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_390px] 2xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="min-w-0">{main}</div>
      <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">{side}</div>
    </div>
  );
}

function SlipSidePanel({ variant, title, hint, emptyText, emptyHint, isEmpty, children }) {
  return (
    <div className={`pos-slip-panel pos-slip-panel--${variant}`}>
      <div className="pos-slip-panel-header">
        <p className="pos-slip-panel-title">{title}</p>
        {hint && <p className="pos-slip-panel-hint">{hint}</p>}
      </div>
      <div className="pos-slip-panel-body">
        {isEmpty ? (
          <div className="pos-slip-empty">
            <p className="pos-slip-empty-title">{emptyText}</p>
            <p className="pos-slip-empty-hint">{emptyHint}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function BillsHistory({ rows, busy, isAdmin, onOpen, onDelete }) {
  return (
    <SlipSidePanel
      variant="sales"
      title="Bills history"
      hint="Tap a bill to open or continue a draft"
      emptyText="No bills yet"
      emptyHint="Start a new bill from the sales terminal to see it here."
      isEmpty={rows.length === 0}
    >
      {rows.map((s) => (
        <div
          key={s.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(Number(s.id))}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpen(Number(s.id));
          }}
          className="pos-slip-record"
        >
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <span className="font-semibold">#{s.id}</span>
            <Badge className="min-w-0 justify-center truncate" variant={String(s.status) === "completed" ? "info" : "default"}>
              {String(s.status)}
            </Badge>
            {String(s.status) === "draft" || isAdmin ? (
              <DeleteButton busy={busy} label={`Delete bill ${s.id}`} onClick={() => onDelete(Number(s.id))} />
            ) : (
              <span className="h-8 w-8" />
            )}
          </div>
          <p className="text-right text-lg font-semibold tabular-nums [font-family:var(--font-outfit),system-ui,sans-serif]">
            {money(s.total_amount)}
          </p>
        </div>
      ))}
    </SlipSidePanel>
  );
}

function SupplierHistory({ rows, busy, isAdmin, onOpen, onDelete }) {
  return (
    <SlipSidePanel
      variant="supplier"
      title="Supplier slips"
      hint="Tap a slip to open · drafts can be edited"
      emptyText="No slips yet"
      emptyHint="Create a supplier slip to record incoming stock and payments."
      isEmpty={rows.length === 0}
    >
      {rows.map((p) => {
        const purchaseItems = Array.isArray(p.items) ? p.items : [];
        const grams = purchaseItems.reduce((sum, item) => sum + Number(item.total_weight_grams ?? 0), 0);
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(Number(p.id))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpen(Number(p.id));
            }}
            className="pos-slip-record"
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="font-semibold">#{p.id}</span>
              <Badge className="min-w-0 justify-center truncate" variant={String(p.status) === "completed" ? "info" : "default"}>
                {String(p.status)}
              </Badge>
              {String(p.status) === "draft" || isAdmin ? (
                <DeleteButton busy={busy} label={`Delete supplier slip ${p.id}`} onClick={() => onDelete(Number(p.id))} />
              ) : (
                <span className="h-8 w-8" />
              )}
            </div>
            <p className="truncate font-medium">{String(p.supplier_name) || "Unnamed supplier"}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">{formatWeight(grams, "kg")}</span>
              <span className="text-right font-semibold tabular-nums">{money(p.total_amount)}</span>
              <span className="text-muted-foreground">Paid {money(p.paid_amount)}</span>
              <span className="text-right text-muted-foreground">Due {money(p.remaining_amount)}</span>
            </div>
            {String(p.payment_status) !== "paid" && (
              <HistoryAction onClick={() => onOpen(Number(p.id))}>Add payment</HistoryAction>
            )}
          </div>
        );
      })}
    </SlipSidePanel>
  );
}

function LedgerHistory({ rows, busy, onOpen, onDelete }) {
  return (
    <SlipSidePanel
      variant="ledger"
      title="Dealer ledgers"
      hint="Credit sales to outside dealers"
      emptyText="No ledgers yet"
      emptyHint="Start a ledger when loading stock for a dealer on credit."
      isEmpty={rows.length === 0}
    >
      {rows.map((entry) => {
        const ledgerItems = Array.isArray(entry.items) ? entry.items : [];
        const grams = ledgerItems.reduce((sum, item) => sum + Number(item.total_weight_grams ?? 0), 0);
        return (
          <div
            key={entry.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(Number(entry.id))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpen(Number(entry.id));
            }}
            className="pos-slip-record"
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="font-semibold">#{entry.id}</span>
              <Badge className="min-w-0 justify-center truncate" variant={String(entry.status) === "completed" ? "info" : "default"}>
                {String(entry.status)}
              </Badge>
              {String(entry.status) === "draft" ? (
                <DeleteButton busy={busy} label={`Delete dealer ledger ${entry.id}`} onClick={() => onDelete(Number(entry.id))} />
              ) : (
                <span className="h-8 w-8" />
              )}
            </div>
            <p className="truncate font-medium">{String(entry.dealer_name) || "Unnamed dealer"}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">{formatWeight(grams, "kg")}</span>
              <span className="text-right font-semibold tabular-nums">{money(entry.total_amount)}</span>
              <span className="text-muted-foreground">Received {money(entry.paid_amount)}</span>
              <span className="text-right text-muted-foreground">Due {money(entry.remaining_amount)}</span>
            </div>
            {String(entry.payment_status) !== "paid" && String(entry.status) === "completed" && (
              <HistoryAction onClick={() => onOpen(Number(entry.id))}>Add installment</HistoryAction>
            )}
          </div>
        );
      })}
    </SlipSidePanel>
  );
}

function ExpenseHistory({ rows, busy, onOpen, onDelete }) {
  return (
    <SlipSidePanel
      variant="expense"
      title="Expenses"
      hint="Operating costs for this shop"
      emptyText="No expenses yet"
      emptyHint="Record wages, rent, utilities, and other costs."
      isEmpty={rows.length === 0}
    >
      {rows.map((entry) => (
        <div
          key={entry.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(Number(entry.id))}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpen(Number(entry.id));
          }}
          className="pos-slip-record"
        >
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <span className="font-semibold">#{entry.id}</span>
            <Badge className="min-w-0 justify-center truncate" variant={String(entry.status) === "completed" ? "info" : "default"}>
              {String(entry.status)}
            </Badge>
            <DeleteButton busy={busy} label={`Delete expense ${entry.id}`} onClick={() => onDelete(Number(entry.id))} />
          </div>
          <p className="truncate font-medium">{String(entry.title)}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="truncate capitalize text-muted-foreground">{String(entry.category).replaceAll("_", " ")}</span>
            <span className="text-right font-semibold tabular-nums">{money(entry.amount)}</span>
            <span className="text-muted-foreground">{String(entry.expense_date)}</span>
            <span className="truncate text-right text-muted-foreground">{String(entry.payment_method || "—")}</span>
          </div>
        </div>
      ))}
    </SlipSidePanel>
  );
}

function DeleteButton({ busy, label, onClick }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="iconSm"
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

function HistoryAction({ onClick, children }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}
