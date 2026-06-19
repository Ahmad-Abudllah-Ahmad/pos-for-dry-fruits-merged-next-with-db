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
  const locationType = sp.get("location_type");

  const balances = await getStockBalances(workspaceId, locationType);
  return jsonResponse(serializeDecimal(balances));
}
