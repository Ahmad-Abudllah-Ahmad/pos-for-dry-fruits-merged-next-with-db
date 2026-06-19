import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal, getSearchParams } from "@/lib/api-helpers";
import { getStockBalances } from "@/lib/inventory-service";

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
  const locationType = sp.get("location_type");

  const balances = await getStockBalances(workspaceId, locationType);
  const total = balances.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const items = balances.slice(start, start + pageSize);

  return jsonResponse({ items: serializeDecimal(items), total, page, page_size: pageSize });
}
