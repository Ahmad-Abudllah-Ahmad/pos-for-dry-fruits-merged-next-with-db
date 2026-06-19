import prisma from "@/lib/prisma";
import { requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, formatPurchaseResponse } from "@/lib/api-helpers";
import { recalculatePurchaseTotal, syncPurchaseMovements } from "@/lib/purchase-service";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, purchase_id, purchase_item_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const purchaseId = parseInt(purchase_id, 10);
  const purchaseItemId = parseInt(purchase_item_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
  });
  if (!purchase) return errorResponse("Purchase slip not found", 404);

  const item = await prisma.purchaseSlipItem.findUnique({ where: { id: purchaseItemId, purchase_slip_id: purchaseId } });
  if (!item) return errorResponse("Purchase item not found", 404);

  const body = await parseBody(request);
  if (!body || !body.item_id) return errorResponse("item_id is required", 400);

  if (body.subledger_id) {
    const subledger = await prisma.subledger.findFirst({ where: { id: body.subledger_id, workspace_id: workspaceId } });
    if (!subledger || subledger.item_id !== body.item_id || !subledger.is_active) {
      return errorResponse("Invalid or inactive subledger", 400);
    }
  }

  await prisma.purchaseSlipItem.update({
    where: { id: purchaseItemId },
    data: {
      item_id: body.item_id,
      subledger_id: body.subledger_id || null,
      package_weight_grams: body.package_weight_grams,
      quantity: body.quantity,
      total_weight_grams: body.total_weight_grams,
      unit_cost: body.unit_cost,
      total_cost: body.total_cost,
    },
  });

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

  return jsonResponse(formatPurchaseResponse(purchase));
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, purchase_id, purchase_item_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const purchaseId = parseInt(purchase_id, 10);
  const purchaseItemId = parseInt(purchase_item_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
  });
  if (!purchase) return errorResponse("Purchase slip not found", 404);

  const item = await prisma.purchaseSlipItem.findUnique({ where: { id: purchaseItemId, purchase_slip_id: purchaseId } });
  if (!item) return errorResponse("Purchase item not found", 404);

  await prisma.purchaseSlipItem.delete({ where: { id: purchaseItemId } });

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

  return jsonResponse(formatPurchaseResponse(purchase));
}
