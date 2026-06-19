import prisma from "./prisma";
import { createMovement, deleteMovementsForReference, getLocation } from "./inventory-service";

export async function syncPurchasePaymentStatus(purchaseId) {
  const purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId },
    include: { payments: true },
  });
  if (!purchase) return;

  const paidAmount = purchase.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalAmount = parseFloat(purchase.total_amount);
  const status = totalAmount > 0 && paidAmount >= totalAmount ? "paid" : "installments";

  await prisma.purchaseSlip.update({
    where: { id: purchaseId },
    data: { payment_status: status },
  });
}

export async function recalculatePurchaseTotal(purchaseId) {
  const purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });
  if (!purchase) return;

  const totalAmount = purchase.items.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
  await prisma.purchaseSlip.update({
    where: { id: purchaseId },
    data: { total_amount: totalAmount },
  });
  await syncPurchasePaymentStatus(purchaseId);
}

export async function syncPurchaseMovements(workspaceId, purchaseId) {
  await deleteMovementsForReference(workspaceId, "purchase", purchaseId);

  const purchase = await prisma.purchaseSlip.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });
  
  if (!purchase || purchase.status !== "completed") return;

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
}
