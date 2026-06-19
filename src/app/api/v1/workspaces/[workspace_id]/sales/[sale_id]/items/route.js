import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";
import { recalculateSaleTotal, syncSaleMovements } from "@/lib/sale-service";
import { getLocation, getItemStock } from "@/lib/inventory-service";

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

  if (sale.status !== "draft" && auth.user.role !== "Admin") {
    return errorResponse("Completed sales cannot be changed", 409);
  }

  const body = await parseBody(request);
  if (!body || !body.item_id || !body.quantity_grams || !body.unit_price) {
    return errorResponse("item_id, quantity_grams, and unit_price are required", 400);
  }

  if (body.subledger_id) {
    const subledger = await prisma.subledger.findFirst({ where: { id: body.subledger_id, workspace_id: workspaceId } });
    if (!subledger || subledger.item_id !== body.item_id || !subledger.is_active) {
      return errorResponse("Invalid or inactive subledger", 400);
    }
  }

  const requiredGrams = body.quantity_grams;
  const existingGrams = sale.items.reduce((sum, item) => item.item_id === body.item_id ? sum + item.quantity_grams : sum, 0);
  const shop = await getLocation(workspaceId, "shop");
  const stock = await getItemStock(workspaceId, body.item_id, shop.id);
  
  if (requiredGrams + existingGrams > stock) {
    return errorResponse("Not enough stock in shop for this sale", 400);
  }

  await prisma.saleItem.create({
    data: {
      sale_id: saleId,
      item_id: body.item_id,
      subledger_id: body.subledger_id || null,
      quantity_grams: body.quantity_grams,
      unit_price: body.unit_price,
      total_price: parseFloat(body.quantity_grams) * parseFloat(body.unit_price),
    },
  });

  await recalculateSaleTotal(saleId);
  await syncSaleMovements(workspaceId, saleId);

  sale = await prisma.sale.findUnique({
    where: { id: saleId, workspace_id: workspaceId },
    include: { items: true },
  });
  return jsonResponse(serializeDecimal(sale), 201);
}
