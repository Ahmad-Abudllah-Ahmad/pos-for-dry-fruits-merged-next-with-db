import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, formatLedgerResponse } from "@/lib/api-helpers";
import { deleteMovementsForReference } from "@/lib/inventory-service";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, entry_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const entryId = parseInt(entry_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  if (!entry) return errorResponse("Ledger entry not found", 404);
  return jsonResponse(formatLedgerResponse(entry));
}

export async function PATCH(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, entry_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const entryId = parseInt(entry_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
  });
  if (!entry) return errorResponse("Ledger entry not found", 404);

  const body = await parseBody(request);
  if (!body) return errorResponse("Invalid request body", 400);

  const updates = {};
  if (body.dealer_name !== undefined) updates.seller_name = body.dealer_name;
  if (body.dealer_phone !== undefined) updates.seller_phone = body.dealer_phone;
  if (body.note !== undefined) updates.notes = body.note;

  await prisma.ledgerEntry.update({ where: { id: entryId }, data: updates });

  entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
    include: { items: true, payments: true },
  });
  return jsonResponse(formatLedgerResponse(entry));
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, entry_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const entryId = parseInt(entry_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId, workspace_id: workspaceId },
  });
  if (!entry) return errorResponse("Ledger entry not found", 404);

  if (entry.status !== "draft" && auth.user.role !== "Admin") {
    return errorResponse("Completed entries cannot be deleted", 409);
  }

  if (entry.status === "completed") {
    await deleteMovementsForReference(workspaceId, "sale", -entryId);
  }

  await prisma.ledgerEntry.delete({ where: { id: entryId } });
  return jsonResponse({ message: "Deleted successfully" });
}
