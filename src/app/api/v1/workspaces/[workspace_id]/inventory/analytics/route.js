import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal } from "@/lib/api-helpers";
import { getStockBalances, buildInventoryState } from "@/lib/inventory-service";

function getIsoWeek(date) {
  const t = new Date(date.valueOf());
  const dayName = (date.getDay() + 6) % 7;
  t.setDate(t.getDate() - dayName + 3);
  const firstThursday = t.valueOf();
  t.setMonth(0, 1);
  if (t.getDay() !== 4) t.setMonth(0, 1 + ((4 - t.getDay()) + 7) % 7);
  return 1 + Math.ceil((firstThursday - t) / 604800000);
}

function getPeriodLabel(kind, date) {
  if (kind === "daily") return date.toISOString().split("T")[0];
  if (kind === "weekly") {
    const year = date.getFullYear();
    const week = getIsoWeek(date);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }
  if (kind === "monthly") return date.toISOString().slice(0, 7);
  return date.getFullYear().toString();
}

function blankPeriodSummary(label) {
  return {
    label, revenue: 0, retail_revenue: 0, dealer_revenue: 0,
    purchase_cost: 0, cogs: 0, gross_profit: 0, expense_amount: 0, net_profit: 0,
    sale_count: 0, invoice_count: 0, dealer_invoice_count: 0,
  };
}

function finalizePeriodSummaries(bucket) {
  return Object.keys(bucket).sort().map(label => {
    const row = bucket[label];
    row.gross_profit = row.revenue - row.cogs;
    row.net_profit = row.gross_profit - row.expense_amount;
    return row;
  });
}

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const balances = await getStockBalances(workspaceId);
  const { saleCostByReference } = await buildInventoryState(workspaceId);

  const [sales, ledgerEntries, purchases, expenses] = await Promise.all([
    prisma.sale.findMany({ where: { workspace_id: workspaceId, status: "completed" } }),
    prisma.ledgerEntry.findMany({ where: { workspace_id: workspaceId, status: "completed" } }),
    prisma.purchaseSlip.findMany({ where: { workspace_id: workspaceId, status: "completed" } }),
    prisma.expenseEntry.findMany({ where: { workspace_id: workspaceId, status: "completed" } }),
  ]);

  const periodBuckets = { daily: {}, weekly: {}, monthly: {}, yearly: {} };

  const updateBucket = (kind, date, updater) => {
    const label = getPeriodLabel(kind, date);
    if (!periodBuckets[kind][label]) periodBuckets[kind][label] = blankPeriodSummary(label);
    updater(periodBuckets[kind][label]);
  };

  for (const purchase of purchases) {
    for (const kind of Object.keys(periodBuckets)) {
      updateBucket(kind, purchase.created_at, (row) => {
        row.purchase_cost += parseFloat(purchase.total_amount);
      });
    }
  }

  for (const sale of sales) {
    const cogs = saleCostByReference[`sale-${sale.id}`] || 0;
    const amount = parseFloat(sale.total_amount);
    for (const kind of Object.keys(periodBuckets)) {
      updateBucket(kind, sale.created_at, (row) => {
        row.revenue += amount;
        row.retail_revenue += amount;
        row.cogs += cogs;
        row.sale_count += 1;
        row.invoice_count += 1;
      });
    }
  }

  for (const entry of ledgerEntries) {
    const cogs = saleCostByReference[`ledger-${entry.id}`] || 0;
    const amount = parseFloat(entry.total_amount);
    for (const kind of Object.keys(periodBuckets)) {
      updateBucket(kind, entry.created_at, (row) => {
        row.revenue += amount;
        row.dealer_revenue += amount;
        row.cogs += cogs;
        row.sale_count += 1;
        row.dealer_invoice_count += 1;
      });
    }
  }

  for (const expense of expenses) {
    const amount = parseFloat(expense.amount);
    for (const kind of Object.keys(periodBuckets)) {
      updateBucket(kind, expense.expense_date, (row) => {
        row.expense_amount += amount;
      });
    }
  }

  let warehouseStockValue = 0, shopStockValue = 0;
  let warehouseStockGrams = 0, shopStockGrams = 0;

  for (const b of balances) {
    if (b.location_type === "warehouse") {
      warehouseStockValue += b.stock_value;
      warehouseStockGrams += b.quantity_grams;
    } else if (b.location_type === "shop") {
      shopStockValue += b.stock_value;
      shopStockGrams += b.quantity_grams;
    }
  }

  const retailRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
  const dealerRevenue = ledgerEntries.reduce((sum, e) => sum + parseFloat(e.total_amount), 0);
  const totalRevenue = retailRevenue + dealerRevenue;
  const totalPurchaseCost = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount), 0);
  const totalCogs = Object.values(saleCostByReference).reduce((sum, v) => sum + v, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;

  const overview = {
    total_revenue: totalRevenue,
    retail_revenue: retailRevenue,
    dealer_revenue: dealerRevenue,
    total_purchase_cost: totalPurchaseCost,
    total_cogs: totalCogs,
    gross_profit: grossProfit,
    total_expenses: totalExpenses,
    net_profit: netProfit,
    inventory_value: warehouseStockValue + shopStockValue,
    warehouse_stock_value: warehouseStockValue,
    shop_stock_value: shopStockValue,
    total_stock_grams: warehouseStockGrams + shopStockGrams,
    warehouse_stock_grams: warehouseStockGrams,
    shop_stock_grams: shopStockGrams,
    completed_sales_count: sales.length,
    completed_dealer_sales_count: ledgerEntries.length,
    completed_purchase_count: purchases.length,
    completed_expense_count: expenses.length,
  };

  return jsonResponse(serializeDecimal({
    overview,
    daily: finalizePeriodSummaries(periodBuckets.daily),
    weekly: finalizePeriodSummaries(periodBuckets.weekly),
    monthly: finalizePeriodSummaries(periodBuckets.monthly),
    yearly: finalizePeriodSummaries(periodBuckets.yearly),
  }));
}
