import prisma from "@/lib/prisma";
import { requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, formatPurchaseResponse } from "@/lib/api-helpers";
import { syncPurchasePaymentStatus } from "@/lib/purchase-service";

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

  const body = await parseBody(request);
  if (!body || body.amount === undefined) return errorResponse("amount is required", 400);

  const paidAmount = purchase.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remaining = Math.max(0, parseFloat(purchase.total_amount) - paidAmount);

  if (body.amount > remaining) {
    return errorResponse("Payment cannot exceed remaining balance", 400);
  }

  await prisma.purchasePayment.create({
    data: {
      purchase_slip_id: purchaseId,
      amount: body.amount,
      payment_method: body.payment_method || purchase.payment_method,
      note: body.note || null,
    },
  });

  await syncPurchasePaymentStatus(purchaseId);

  purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatPurchaseResponse(purchase));
}
