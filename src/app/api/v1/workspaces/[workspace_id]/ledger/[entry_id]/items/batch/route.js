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
  if (!body || !body.items || body.items.length === 0) {
    return errorResponse("items array is required", 400);
  }

  const warehouse = await getLocation(workspaceId, "warehouse");
  
  // Quick pre-check for stock, though not perfect if same item appears multiple times
  for (const item of body.items) {
    const stock = await getItemStock(workspaceId, item.item_id, warehouse.id);
    if (item.quantity_grams > stock) {
      return errorResponse(`Not enough stock in warehouse for item ID ${item.item_id}`, 400);
    }
  }

  for (const item of body.items) {
    if (item.subledger_id) {
      const subledger = await prisma.subledger.findFirst({ where: { id: item.subledger_id, workspace_id: workspaceId } });
      if (!subledger || subledger.item_id !== item.item_id || !subledger.is_active) {
        return errorResponse("Invalid or inactive subledger", 400);
      }
    }

    await prisma.ledgerEntryItem.create({
      data: {
        ledger_entry_id: entryId,
        item_id: item.item_id,
        subledger_id: item.subledger_id || null,
        quantity: item.quantity || 1,
        quantity_grams: item.quantity_grams,
        unit_price: item.unit_price,
        total_price: parseFloat(item.quantity_grams) * parseFloat(item.unit_price),
      },
    });
  }

  await recalculateLedgerTotal(entryId);
  await syncLedgerMovements(workspaceId, entryId);

  entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatLedgerResponse(entry), 201);
}
