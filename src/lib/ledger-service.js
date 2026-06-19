import prisma from "./prisma";
import { createMovement, deleteMovementsForReference, getLocation } from "./inventory-service";

export async function syncLedgerPaymentStatus(ledgerId) {
  const ledger = await prisma.ledgerEntry.findUnique({
    where: { id: ledgerId },
    include: { payments: true },
  });
  if (!ledger) return;

  const paidAmount = ledger.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalAmount = parseFloat(ledger.total_amount);
  const status = totalAmount > 0 && paidAmount >= totalAmount ? "paid" : "installments";

  const data = { payment_status: status, paid_amount: paidAmount };
  if (status === "paid" && !ledger.paid_at) {
    data.paid_at = new Date();
  }

  await prisma.ledgerEntry.update({
    where: { id: ledgerId },
    data,
  });
}

export async function recalculateLedgerTotal(ledgerId) {
  const ledger = await prisma.ledgerEntry.findUnique({
    where: { id: ledgerId },
    include: { items: true },
  });
  if (!ledger) return;

  const totalAmount = ledger.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
  await prisma.ledgerEntry.update({
    where: { id: ledgerId },
    data: { total_amount: totalAmount },
  });
  await syncLedgerPaymentStatus(ledgerId);
}

export async function syncLedgerMovements(workspaceId, ledgerId) {
  await deleteMovementsForReference(workspaceId, "sale", -ledgerId);

  const ledger = await prisma.ledgerEntry.findUnique({
    where: { id: ledgerId },
    include: { items: true },
  });
  
  if (!ledger || ledger.status !== "completed") return;

  const warehouse = await getLocation(workspaceId, "warehouse");
  for (const item of ledger.items) {
    await createMovement({
      workspace_id: workspaceId,
      item_id: item.item_id,
      quantity_grams: item.quantity_grams,
      type: "sale",
      from_location_id: warehouse.id,
      reference_id: -ledger.id,
    });
  }
}
