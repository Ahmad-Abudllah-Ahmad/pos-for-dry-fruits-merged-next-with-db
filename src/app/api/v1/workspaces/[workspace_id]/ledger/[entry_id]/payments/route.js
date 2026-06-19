import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, formatLedgerResponse } from "@/lib/api-helpers";
import { syncLedgerPaymentStatus } from "@/lib/ledger-service";

export async function POST(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, entry_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const entryId = parseInt(entry_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
    include: { payments: true },
  });
  if (!entry) return errorResponse("Ledger entry not found", 404);

  const body = await parseBody(request);
  if (!body || body.amount === undefined) return errorResponse("amount is required", 400);

  const paidAmount = entry.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remaining = Math.max(0, parseFloat(entry.total_amount) - paidAmount);

  if (body.amount > remaining) {
    return errorResponse("Payment cannot exceed remaining balance", 400);
  }

  await prisma.ledgerPayment.create({
    data: {
      ledger_entry_id: entryId,
      amount: body.amount,
      payment_method: body.payment_method || entry.payment_method,
      note: body.note || null,
    },
  });

  await syncLedgerPaymentStatus(entryId);

  entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatLedgerResponse(entry), 201);
}
