import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, formatLedgerResponse } from "@/lib/api-helpers";
import { syncLedgerPaymentStatus, syncLedgerMovements } from "@/lib/ledger-service";

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
    include: { items: true, payments: true },
  });
  if (!entry) return errorResponse("Ledger entry not found", 404);
  
  if (entry.status !== "draft") {
    return errorResponse("Completed entries cannot be changed", 409);
  }
  if (entry.items.length === 0) {
    return errorResponse("Ledger entry must have at least one item", 400);
  }

  await prisma.ledgerEntry.update({
    where: { id: entryId },
    data: { status: "completed" },
  });

  await syncLedgerMovements(workspaceId, entryId);
  await syncLedgerPaymentStatus(entryId);

  entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatLedgerResponse(entry));
}
