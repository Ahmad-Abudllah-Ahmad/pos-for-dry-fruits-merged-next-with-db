import prisma from "@/lib/prisma";
import { requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, formatPurchaseResponse } from "@/lib/api-helpers";
import { recalculatePurchaseTotal, syncPurchaseMovements } from "@/lib/purchase-service";

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, purchase_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const purchaseId = parseInt(purchase_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
  });
  if (!purchase) return errorResponse("Purchase slip not found", 404);

  const body = await parseBody(request);
  if (!body || !body.items || body.items.length === 0) return errorResponse("items are required", 400);

  for (const item of body.items) {
    if (item.subledger_id) {
      const subledger = await prisma.subledger.findFirst({ where: { id: item.subledger_id, workspace_id: workspaceId } });
      if (!subledger || subledger.item_id !== item.item_id || !subledger.is_active) {
        return errorResponse("Invalid or inactive subledger", 400);
      }
    }
    await prisma.purchaseSlipItem.create({
      data: {
        purchase_slip_id: purchaseId,
        item_id: item.item_id,
        subledger_id: item.subledger_id || null,
        package_weight_grams: item.package_weight_grams,
        quantity: item.quantity,
        total_weight_grams: item.total_weight_grams,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
      },
    });
  }

  await recalculatePurchaseTotal(purchaseId);
  await syncPurchaseMovements(workspaceId, purchaseId);

  purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  
  const paidAmount = purchase.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  if (paidAmount > parseFloat(purchase.total_amount)) {
    return errorResponse("Paid amount cannot exceed slip total", 400);
  }

  return jsonResponse(formatPurchaseResponse(purchase), 201);
}
