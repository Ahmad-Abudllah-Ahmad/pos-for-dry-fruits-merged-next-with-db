import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal } from "@/lib/api-helpers";
import { deleteMovementsForReference } from "@/lib/inventory-service";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, sale_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const saleId = parseInt(sale_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const sale = await prisma.sale.findUnique({
    where: { id: saleId, workspace_id: workspaceId },
    include: { items: true },
  });
  if (!sale) return errorResponse("Sale not found", 404);
  return jsonResponse(serializeDecimal(sale));
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, sale_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const saleId = parseInt(sale_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const sale = await prisma.sale.findUnique({
    where: { id: saleId, workspace_id: workspaceId },
  });
  if (!sale) return errorResponse("Sale not found", 404);

  if (sale.status !== "draft" && auth.user.role !== "Admin") {
    return errorResponse("Completed sales cannot be deleted", 409);
  }

  if (sale.status === "completed") {
    await deleteMovementsForReference(workspaceId, "sale", saleId);
  }

  await prisma.sale.delete({ where: { id: saleId } });
  return jsonResponse({ message: "Deleted successfully" });
}
