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
  if (sp.has("is_active")) where.is_active = sp.get("is_active") === "true";

  const items = await prisma.item.findMany({ where, orderBy: { created_at: "desc" } });
  return jsonResponse(serializeDecimal(items));
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const body = await parseBody(request);
  if (!body || !body.name || !body.unit_type) return errorResponse("name and unit_type are required", 400);

  const item = await prisma.item.create({
    data: { workspace_id: workspaceId, name: body.name, unit_type: body.unit_type },
  });
  return jsonResponse(serializeDecimal(item), 201);
}
