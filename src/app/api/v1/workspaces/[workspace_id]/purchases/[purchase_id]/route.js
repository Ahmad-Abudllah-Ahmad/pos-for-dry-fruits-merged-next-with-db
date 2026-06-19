import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, formatPurchaseResponse } from "@/lib/api-helpers";
import { syncPurchasePaymentStatus, syncPurchaseMovements } from "@/lib/purchase-service";
import { deleteMovementsForReference } from "@/lib/inventory-service";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, purchase_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const purchaseId = parseInt(purchase_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  if (!purchase) return errorResponse("Purchase slip not found", 404);
  return jsonResponse(formatPurchaseResponse(purchase));
}

export async function PATCH(request, { params }) {
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
  if (!body) return errorResponse("Invalid request body", 400);

  const updates = {};
  if (body.supplier_name !== undefined) updates.supplier_name = body.supplier_name;
  if (body.declared_total !== undefined) updates.declared_total = body.declared_total;
  if (body.payment_method !== undefined) updates.payment_method = body.payment_method;

  if (purchase.status === "draft") {
    if (body.payment_status !== undefined) updates.payment_status = body.payment_status;
    
    await prisma.purchaseSlip.update({ where: { id: purchaseId }, data: updates });
    
    if (body.paid_amount !== undefined) {
      if (body.paid_amount > parseFloat(purchase.total_amount)) {
        return errorResponse("Paid amount cannot exceed slip total", 400);
      }
      await prisma.purchasePayment.deleteMany({ where: { purchase_slip_id: purchaseId } });
      if (body.paid_amount > 0) {
        await prisma.purchasePayment.create({
          data: {
            purchase_slip_id: purchaseId,
            amount: body.paid_amount,
            payment_method: body.payment_method || null,
            note: body.payment_note || null,
          },
        });
      }
    }
    
    if (body.payment_status === "paid" && (!body.paid_amount || body.paid_amount === 0)) {
       await prisma.purchaseSlip.update({ where: { id: purchaseId }, data: { payment_status: "paid" } });
    } else {
       await syncPurchasePaymentStatus(purchaseId);
    }
  } else {
    await prisma.purchaseSlip.update({ where: { id: purchaseId }, data: updates });
    await syncPurchaseMovements(workspaceId, purchaseId);
  }

  purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatPurchaseResponse(purchase));
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, purchase_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const purchaseId = parseInt(purchase_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
  });
  if (!purchase) return errorResponse("Purchase slip not found", 404);

  if (purchase.status === "completed") {
    await deleteMovementsForReference(workspaceId, "purchase", purchaseId);
  }
  await prisma.purchaseSlip.delete({ where: { id: purchaseId } });
  
  return jsonResponse({ message: "Deleted successfully" });
}
