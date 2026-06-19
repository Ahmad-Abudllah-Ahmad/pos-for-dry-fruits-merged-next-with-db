import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, formatLedgerResponse } from "@/lib/api-helpers";
import { recalculateLedgerTotal, syncLedgerMovements } from "@/lib/ledger-service";
import { getLocation, getItemStock } from "@/lib/inventory-service";

export async function POST(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, entry_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const entryId = parseInt(entry_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
  });
  if (!entry) return errorResponse("Ledger entry not found", 404);

  if (entry.status !== "draft" && auth.user.role !== "Admin") {
    return errorResponse("Completed entries cannot be changed", 409);
  }

  const body = await parseBody(request);
  if (!body || !body.item_id || !body.quantity_grams || !body.unit_price) {
    return errorResponse("item_id, quantity_grams, and unit_price are required", 400);
  }

  if (body.subledger_id) {
    const subledger = await prisma.subledger.findFirst({ where: { id: body.subledger_id, workspace_id: workspaceId } });
    if (!subledger || subledger.item_id !== body.item_id || !subledger.is_active) {
      return errorResponse("Invalid or inactive subledger", 400);
    }
  }

  const requiredGrams = body.quantity_grams;
  const warehouse = await getLocation(workspaceId, "warehouse");
  const stock = await getItemStock(workspaceId, body.item_id, warehouse.id);
  
  if (requiredGrams > stock) {
    return errorResponse("Not enough stock in warehouse for this ledger entry", 400);
  }

  await prisma.ledgerEntryItem.create({
    data: {
      ledger_entry_id: entryId,
      item_id: body.item_id,
      subledger_id: body.subledger_id || null,
      quantity: body.quantity || 1,
      quantity_grams: body.quantity_grams,
      unit_price: body.unit_price,
      total_price: parseFloat(body.quantity_grams) * parseFloat(body.unit_price),
    },
  });

  await recalculateLedgerTotal(entryId);
  await syncLedgerMovements(workspaceId, entryId);

  entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatLedgerResponse(entry), 201);
}
