import prisma from "@/lib/prisma";
import { requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, subledger_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const subledgerId = parseInt(subledger_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const subledger = await prisma.subledger.findFirst({ where: { id: subledgerId, workspace_id: workspaceId } });
  if (!subledger) return errorResponse("Subledger not found", 404);

  const body = await parseBody(request);
  if (!body) return errorResponse("Invalid request body", 400);

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.unit_price !== undefined) updates.unit_price = body.unit_price;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.item_id !== undefined) {
    const item = await prisma.item.findFirst({ where: { id: body.item_id, workspace_id: workspaceId } });
    if (!item) return errorResponse("Item not found", 404);
    updates.item_id = body.item_id;
  }

  const updated = await prisma.subledger.update({ where: { id: subledgerId }, data: updates });
  return jsonResponse(serializeDecimal(updated));
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, subledger_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const subledgerId = parseInt(subledger_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const subledger = await prisma.subledger.findFirst({ where: { id: subledgerId, workspace_id: workspaceId } });
  if (!subledger) return errorResponse("Subledger not found", 404);

  const updated = await prisma.subledger.update({ where: { id: subledgerId }, data: { is_active: false } });
  return jsonResponse(serializeDecimal(updated));
}
