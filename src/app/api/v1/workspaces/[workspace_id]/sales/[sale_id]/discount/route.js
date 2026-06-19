import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";
import { recalculateSaleTotal } from "@/lib/sale-service";

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
  });
  if (!sale) return errorResponse("Sale not found", 404);

  if (sale.status !== "draft" && auth.user.role !== "Admin") {
    return errorResponse("Completed sales cannot be changed", 409);
  }

  const body = await parseBody(request);
  if (!body || body.discount_amount === undefined) return errorResponse("discount_amount is required", 400);

  if (body.discount_amount > parseFloat(sale.subtotal_amount)) {
    return errorResponse("Discount cannot exceed subtotal", 400);
  }

  await prisma.sale.update({
    where: { id: saleId },
    data: { discount_amount: body.discount_amount },
  });

  await recalculateSaleTotal(saleId);

  sale = await prisma.sale.findUnique({
    where: { id: saleId, workspace_id: workspaceId },
    include: { items: true },
  });
  return jsonResponse(serializeDecimal(sale));
}
