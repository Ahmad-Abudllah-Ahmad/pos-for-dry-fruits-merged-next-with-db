import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal, getSearchParams } from "@/lib/api-helpers";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const sp = getSearchParams(request);
  const where = { workspace_id: workspaceId };
  if (sp.has("item_id")) where.item_id = parseInt(sp.get("item_id"), 10);
  if (sp.has("is_active")) where.is_active = sp.get("is_active") === "true";

  const subledgers = await prisma.subledger.findMany({ where, orderBy: { created_at: "desc" } });
  return jsonResponse(serializeDecimal(subledgers));
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const body = await parseBody(request);
  if (!body || !body.name || !body.item_id) return errorResponse("name and item_id are required", 400);

  const item = await prisma.item.findFirst({ where: { id: body.item_id, workspace_id: workspaceId } });
  if (!item) return errorResponse("Item not found", 404);

  const subledger = await prisma.subledger.create({
    data: {
      workspace_id: workspaceId,
      item_id: body.item_id,
      name: body.name,
      unit_price: body.unit_price || null,
    },
  });
  return jsonResponse(serializeDecimal(subledger), 201);
}
