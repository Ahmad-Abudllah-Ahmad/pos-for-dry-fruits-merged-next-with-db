import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal, getSearchParams } from "@/lib/api-helpers";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const sp = getSearchParams(request);
  const page = parseInt(sp.get("page") || "1", 10);
  const pageSize = parseInt(sp.get("page_size") || "10", 10);
  const where = { workspace_id: workspaceId };
  if (sp.has("is_active")) where.is_active = sp.get("is_active") === "true";

  const [total, items] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({ where, orderBy: { created_at: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);

  return jsonResponse({ items: serializeDecimal(items), total, page, page_size: pageSize });
}
