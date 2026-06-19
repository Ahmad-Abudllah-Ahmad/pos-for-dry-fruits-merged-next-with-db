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
  if (!body || !body.item_id || !body.direction || !body.quantity_grams) {
    return errorResponse("item_id, direction, and quantity_grams are required", 400);
  }

  const warehouse = await getLocation(workspaceId, "warehouse");
  const shop = await getLocation(workspaceId, "shop");
  const source = body.direction === "shop_to_warehouse" ? shop : warehouse;
  const destination = body.direction === "shop_to_warehouse" ? warehouse : shop;

  if (body.subledger_id) {
    const subledger = await prisma.subledger.findUnique({ where: { id: body.subledger_id } });
    if (!subledger || subledger.item_id !== body.item_id || !subledger.is_active) {
      return errorResponse("Invalid or inactive subledger", 400);
    }
  }

  const stock = await getItemStock(workspaceId, body.item_id, source.id);
  if (body.quantity_grams > stock) {
    return errorResponse(`Not enough stock in ${source.type} to move to ${destination.type}`, 400);
  }

  const referenceId = BigInt(Date.now());
  const movement = await createMovement({
    workspace_id: workspaceId,
    item_id: body.item_id,
    subledger_id: body.subledger_id || null,
    quantity: body.quantity || null,
    quantity_grams: body.quantity_grams,
    type: "transfer",
    from_location_id: source.id,
    to_location_id: destination.id,
    reference_id: referenceId,
  });

  const serialized = { ...movement, reference_id: movement.reference_id?.toString() };
  return jsonResponse(serializeDecimal(serialized), 201);
}
