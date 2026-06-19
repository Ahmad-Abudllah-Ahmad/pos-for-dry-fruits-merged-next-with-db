import prisma from "./prisma";
import { createMovement, deleteMovementsForReference, getLocation } from "./inventory-service";

export async function recalculateSaleTotal(saleId) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });
  if (!sale) return;

  const subtotal = sale.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
  const discount = parseFloat(sale.discount_amount);
  const total = Math.max(0, subtotal - discount);

  await prisma.sale.update({
    where: { id: saleId },
    data: { subtotal_amount: subtotal, total_amount: total },
  });
}

export async function syncSaleMovements(workspaceId, saleId) {
  await deleteMovementsForReference(workspaceId, "sale", saleId);

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });
  
  if (!sale || sale.status !== "completed") return;

  const shop = await getLocation(workspaceId, "shop");
  for (const item of sale.items) {
    await createMovement({
      workspace_id: workspaceId,
      item_id: item.item_id,
      quantity_grams: item.quantity_grams,
      type: "sale",
      from_location_id: shop.id,
      reference_id: sale.id,
    });
  }
}
