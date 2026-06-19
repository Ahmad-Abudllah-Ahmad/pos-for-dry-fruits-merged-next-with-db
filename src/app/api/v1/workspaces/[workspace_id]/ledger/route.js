import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, formatLedgerResponse } from "@/lib/api-helpers";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const entries = await prisma.ledgerEntry.findMany({
    where: { workspace_id: workspaceId },
    include: { items: true, payments: true },
    orderBy: { created_at: "desc" },
  });
  return jsonResponse(entries.map(formatLedgerResponse));
}

export async function POST(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const body = await parseBody(request);
  if (!body || !body.dealer_name) return errorResponse("dealer_name is required", 400);

  const entry = await prisma.ledgerEntry.create({
    data: {
      workspace_id: workspaceId,
      created_by_id: auth.user.id,
      seller_name: body.dealer_name,
      seller_phone: body.dealer_phone || null,
      notes: body.note || null,
      total_amount: 0,
      paid_amount: 0,
      payment_method: null,
      payment_status: "installments",
      status: "draft",
    },
    include: { items: true, payments: true },
  });

  return jsonResponse(formatLedgerResponse(entry), 201);
}
