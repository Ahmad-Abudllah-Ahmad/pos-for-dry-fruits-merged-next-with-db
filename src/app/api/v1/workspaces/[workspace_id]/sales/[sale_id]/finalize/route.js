import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal } from "@/lib/api-helpers";
import { syncSaleMovements } from "@/lib/sale-service";

export async function POST(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, sale_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const saleId = parseInt(sale_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let sale = await prisma.sale.findUnique({
    where: { id: saleId, workspace_id: workspaceId },
    include: { items: true },
  });
  if (!sale) return errorResponse("Sale not found", 404);

  if (sale.status !== "draft") {
    return errorResponse("Sale is already completed", 409);
  }

  if (sale.items.length === 0) {
    return errorResponse("Sale must have at least one item", 400);
  }

  await prisma.sale.update({
    where: { id: saleId },
    data: { status: "completed" },
  });

  await syncSaleMovements(workspaceId, saleId);

  sale = await prisma.sale.findUnique({
    where: { id: saleId, workspace_id: workspaceId },
    include: { items: true },
  });
  return jsonResponse(serializeDecimal(sale));
}
