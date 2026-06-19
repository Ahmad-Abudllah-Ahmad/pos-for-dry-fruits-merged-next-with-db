import prisma from "@/lib/prisma";
import { requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";
import { getLocation, getItemStock, createMovement } from "@/lib/inventory-service";

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const body = await parseBody(request);
  if (!body || !body.items || body.items.length === 0 || !body.direction) {
    return errorResponse("items and direction are required", 400);
  }

  const warehouse = await getLocation(workspaceId, "warehouse");
  const shop = await getLocation(workspaceId, "shop");
  const source = body.direction === "shop_to_warehouse" ? shop : warehouse;
  const destination = body.direction === "shop_to_warehouse" ? warehouse : shop;
  const sourceLabel = source.type;
  const destinationLabel = destination.type;

  const totalsByItem = {};
  for (const item of body.items) {
    if (item.subledger_id) {
      const subledger = await prisma.subledger.findUnique({ where: { id: item.subledger_id } });
      if (!subledger || subledger.item_id !== item.item_id || !subledger.is_active) {
        return errorResponse("Invalid or inactive subledger", 400);
      }
    }
    totalsByItem[item.item_id] = (totalsByItem[item.item_id] || 0) + item.quantity_grams;
  }

  for (const [itemIdStr, requiredGrams] of Object.entries(totalsByItem)) {
    const itemId = parseInt(itemIdStr, 10);
    const stock = await getItemStock(workspaceId, itemId, source.id);
    if (requiredGrams > stock) {
      return errorResponse(`Not enough stock in ${sourceLabel} to move to ${destinationLabel}`, 400);
    }
  }

  const referenceId = BigInt(Date.now());
  const created = [];

  for (const item of body.items) {
    const movement = await createMovement({
      workspace_id: workspaceId,
      item_id: item.item_id,
      subledger_id: item.subledger_id || null,
      quantity: item.quantity || null,
      quantity_grams: item.quantity_grams,
      type: "transfer",
      from_location_id: source.id,
      to_location_id: destination.id,
      reference_id: referenceId,
    });
    created.push(movement);
  }

  // Next.js jsonResponse automatically converts BigInt if we use a reviver, but serializeDecimal doesn't.
  // We need to serialize BigInts to strings. serializeDecimal will handle it if we modify it or we just map it here.
  const serialized = created.map(m => ({ ...m, reference_id: m.reference_id?.toString() }));
  return jsonResponse(serializeDecimal(serialized), 201);
}
