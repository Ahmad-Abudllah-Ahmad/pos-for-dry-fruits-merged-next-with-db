import prisma from "@/lib/prisma";
import { requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, formatPurchaseResponse } from "@/lib/api-helpers";
import { syncPurchasePaymentStatus } from "@/lib/purchase-service";
import { getLocation, createMovement } from "@/lib/inventory-service";

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
    include: { items: true, payments: true },
  });
  if (!purchase) return errorResponse("Purchase slip not found", 404);
  
  if (purchase.status !== "draft") {
    return errorResponse("Completed purchase slips cannot be changed", 409);
  }
  if (purchase.items.length === 0) {
    return errorResponse("Purchase slip must have at least one item", 400);
  }

  const warehouse = await getLocation(workspaceId, "warehouse");
  for (const item of purchase.items) {
    await createMovement({
      workspace_id: workspaceId,
      item_id: item.item_id,
      subledger_id: item.subledger_id,
      quantity_grams: item.total_weight_grams,
      type: "purchase",
      to_location_id: warehouse.id,
      reference_id: purchase.id,
    });
  }

  const paidAmount = purchase.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  if (purchase.payment_status === "paid" && paidAmount === 0) {
    await prisma.purchasePayment.create({
      data: {
        purchase_slip_id: purchase.id,
        amount: purchase.total_amount,
        payment_method: purchase.payment_method,
        note: "Paid on finalize",
      },
    });
  }

  await syncPurchasePaymentStatus(purchaseId);
  
  await prisma.purchaseSlip.update({
    where: { id: purchaseId },
    data: { status: "completed" },
  });

  purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatPurchaseResponse(purchase));
}
