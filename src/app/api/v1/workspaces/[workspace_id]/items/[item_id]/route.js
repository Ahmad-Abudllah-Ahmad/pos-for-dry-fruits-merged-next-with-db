import prisma from "@/lib/prisma";
import { requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, item_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const itemId = parseInt(item_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const item = await prisma.item.findFirst({ where: { id: itemId, workspace_id: workspaceId } });
  if (!item) return errorResponse("Item not found", 404);

  const body = await parseBody(request);
  if (!body) return errorResponse("Invalid request body", 400);

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.unit_type !== undefined) updates.unit_type = body.unit_type;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const updated = await prisma.item.update({ where: { id: itemId }, data: updates });
  return jsonResponse(serializeDecimal(updated));
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, item_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const itemId = parseInt(item_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const item = await prisma.item.findFirst({ where: { id: itemId, workspace_id: workspaceId } });
  if (!item) return errorResponse("Item not found", 404);

  // Soft delete item and linked subledgers
  await prisma.subledger.updateMany({
    where: { workspace_id: workspaceId, item_id: itemId },
    data: { is_active: false },
  });
  const updated = await prisma.item.update({ where: { id: itemId }, data: { is_active: false } });
  return jsonResponse(serializeDecimal(updated));
}
