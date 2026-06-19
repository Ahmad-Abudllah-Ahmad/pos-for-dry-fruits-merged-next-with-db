import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal } from "@/lib/api-helpers";

export async function POST(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, expense_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const expenseId = parseInt(expense_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let expense = await prisma.expenseEntry.findUnique({
    where: { id: expenseId, workspace_id: workspaceId },
  });
  if (!expense) return errorResponse("Expense entry not found", 404);

  if (expense.status !== "draft") {
    return errorResponse("Expense is already completed", 409);
  }

  expense = await prisma.expenseEntry.update({
    where: { id: expenseId },
    data: { status: "completed" },
  });

  return jsonResponse(serializeDecimal(expense));
}
