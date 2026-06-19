import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const sales = await prisma.sale.findMany({
    where: { workspace_id: workspaceId },
    include: { items: true },
    orderBy: { created_at: "desc" },
  });
  return jsonResponse(serializeDecimal(sales));
}

export async function POST(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const body = await parseBody(request);
  const discountAmount = body?.discount_amount || 0;

  const sale = await prisma.sale.create({
    data: {
      workspace_id: workspaceId,
      created_by_id: auth.user.id,
      subtotal_amount: 0,
      discount_amount: discountAmount,
      total_amount: 0,
      status: "draft",
    },
    include: { items: true },
  });

  return jsonResponse(serializeDecimal(sale), 201);
}
