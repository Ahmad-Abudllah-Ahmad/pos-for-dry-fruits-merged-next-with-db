import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal, formatPurchaseResponse } from "@/lib/api-helpers";
import { recalculatePurchaseTotal, syncPurchasePaymentStatus, syncPurchaseMovements } from "@/lib/purchase-service";
import { getLocation } from "@/lib/inventory-service";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const purchases = await prisma.purchaseSlip.findMany({
    where: { workspace_id: workspaceId },
    include: { items: true, payments: true },
    orderBy: { created_at: "desc" },
  });
  return jsonResponse(purchases.map(formatPurchaseResponse));
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const body = await parseBody(request);
  if (!body || !body.supplier_name) return errorResponse("supplier_name is required", 400);

  const warehouse = await getLocation(workspaceId, "warehouse");

  let purchase = await prisma.purchaseSlip.create({
    data: {
      workspace_id: workspaceId,
      supplier_name: body.supplier_name,
      location_id: warehouse.id,
      created_by_id: auth.user.id,
      declared_total: body.declared_total || null,
      payment_method: body.payment_method || null,
      payment_status: body.payment_status || "installments",
      total_amount: 0,
      status: "draft",
    },
  });

  if (body.items && body.items.length > 0) {
    for (const item of body.items) {
      if (item.subledger_id) {
        const subledger = await prisma.subledger.findFirst({ where: { id: item.subledger_id, workspace_id: workspaceId } });
        if (!subledger || subledger.item_id !== item.item_id || !subledger.is_active) {
          return errorResponse("Invalid or inactive subledger", 400);
        }
      }
      await prisma.purchaseSlipItem.create({
        data: {
          purchase_slip_id: purchase.id,
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
  }

  await recalculatePurchaseTotal(purchase.id);

  if (body.paid_amount > 0) {
    const updated = await prisma.purchaseSlip.findUnique({ where: { id: purchase.id } });
    if (body.paid_amount > parseFloat(updated.total_amount)) {
      return errorResponse("Paid amount cannot exceed slip total", 400);
    }
    await prisma.purchasePayment.create({
      data: {
        purchase_slip_id: purchase.id,
        amount: body.paid_amount,
        payment_method: body.payment_method || null,
        note: body.payment_note || null,
      },
    });
    await syncPurchasePaymentStatus(purchase.id);
  }

  purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchase.id },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatPurchaseResponse(purchase), 201);
}
